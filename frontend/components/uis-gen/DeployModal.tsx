'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Modal from '@/components/ui/Modal';
import { deployApi, UisGenDeployment, UisGenDeploymentStatus } from '@/lib/api';

interface DeployModalProps {
  projectId: string;
  onClose: () => void;
}

const STAGES: { status: UisGenDeploymentStatus; label: string }[] = [
  { status: 'pending', label: 'เตรียมข้อมูล' },
  { status: 'generating', label: 'สร้าง Manifest' },
  { status: 'building', label: 'Build & Start Docker' },
  { status: 'starting', label: 'กำลังเริ่มระบบ' },
  { status: 'running', label: 'ทำงานแล้ว' },
];
const STAGE_ORDER = STAGES.map(s => s.status);

const STATUS_LABEL: Record<UisGenDeploymentStatus, string> = {
  pending: 'เตรียมข้อมูล', generating: 'สร้าง Manifest', building: 'Build & Start Docker',
  starting: 'กำลังเริ่มระบบ', running: 'ทำงานแล้ว', failed: 'ล้มเหลว', stopped: 'หยุดแล้ว',
};

export default function DeployModal({ projectId, onClose }: DeployModalProps) {
  const [deployment, setDeployment] = useState<UisGenDeployment | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const logPaneRef = useRef<HTMLDivElement>(null);
  const deploymentIdRef = useRef<string | null>(null);

  // Trigger the deploy exactly once when the modal opens.
  useEffect(() => {
    deployApi.start(projectId)
      .then(res => { setDeployment(res.data); deploymentIdRef.current = res.data.id; })
      .catch(() => setError('เริ่ม Deploy ไม่สำเร็จ'));
  }, [projectId]);

  // Live updates via socket.io (same path/rewrite as the chat feature), with polling as a
  // fallback so the modal stays correct even if the socket connection never comes up.
  useEffect(() => {
    const wsUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:9191';
    const socket = io(wsUrl, { path: '/ics-backoffice/socket.io', withCredentials: true, transports: ['polling', 'websocket'] });

    socket.on('connect', () => {
      if (deploymentIdRef.current) socket.emit('subscribe', { deploymentId: deploymentIdRef.current });
    });
    socket.on('deploy_log', (line: string) => setLogs(prev => [...prev, line]));
    socket.on('deploy_status', (status: UisGenDeploymentStatus) => setDeployment(prev => (prev ? { ...prev, status } : prev)));

    const interval = setInterval(async () => {
      const id = deploymentIdRef.current;
      if (!id) return;
      try {
        const [statusRes, logsRes] = await Promise.all([deployApi.getStatus(id), deployApi.getLogs(id)]);
        setDeployment(statusRes.data);
        setLogs(logsRes.data.lines);
        if (['running', 'failed', 'stopped'].includes(statusRes.data.status)) clearInterval(interval);
      } catch { /* transient — next tick retries */ }
    }, 2000);

    return () => { socket.disconnect(); clearInterval(interval); };
  }, []);

  // Re-subscribe once the deployment id is known (the socket may already be connected by then).
  useEffect(() => {
    if (deployment?.id) deploymentIdRef.current = deployment.id;
  }, [deployment?.id]);

  useEffect(() => {
    logPaneRef.current?.scrollTo({ top: logPaneRef.current.scrollHeight });
  }, [logs]);

  async function handleStop() {
    if (!deployment) return;
    const res = await deployApi.stop(deployment.id);
    setDeployment(res.data);
  }

  const currentStageIndex = deployment ? STAGE_ORDER.indexOf(deployment.status) : -1;
  const isTerminal = deployment && ['running', 'failed', 'stopped'].includes(deployment.status);

  return (
    <Modal title="Deploy" onClose={onClose} size="lg">
      <div className="space-y-5">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {deployment?.status === 'failed' ? (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            Deploy ล้มเหลว: {deployment.lastError || 'ไม่ทราบสาเหตุ'}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {STAGES.map((stage, i) => (
              <div key={stage.status} className="flex items-center gap-1 flex-1">
                <div className={`flex-1 h-1.5 rounded-full ${i <= currentStageIndex ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                {i < STAGES.length - 1 && <span className="w-1" />}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm font-medium text-slate-700">
          สถานะ: <span className={deployment?.status === 'failed' ? 'text-red-600' : deployment?.status === 'running' ? 'text-emerald-600' : 'text-indigo-600'}>
            {deployment ? STATUS_LABEL[deployment.status] : 'กำลังเริ่ม…'}
          </span>
        </p>

        <div ref={logPaneRef} className="h-64 overflow-y-auto rounded-lg bg-slate-900 text-slate-200 text-xs font-mono p-3 space-y-0.5">
          {logs.length === 0 && <p className="text-slate-500">กำลังรอ log…</p>}
          {logs.map((line, i) => <div key={i} className="whitespace-pre-wrap break-all">{line}</div>)}
        </div>

        {deployment?.status === 'running' && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="text-sm text-emerald-700 space-y-0.5">
              <p>Frontend: <a href={`http://localhost:${deployment.frontendPort}`} target="_blank" rel="noreferrer" className="font-medium underline">http://localhost:{deployment.frontendPort}</a></p>
              <p>Backend: <a href={`http://localhost:${deployment.backendPort}`} target="_blank" rel="noreferrer" className="font-medium underline">http://localhost:{deployment.backendPort}</a></p>
            </div>
            <button
              type="button"
              onClick={handleStop}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition"
            >
              Stop
            </button>
          </div>
        )}

        {isTerminal && (
          <button
            type="button"
            onClick={onClose}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium transition"
          >
            ปิด
          </button>
        )}
      </div>
    </Modal>
  );
}
