'use client';
import { useState, useEffect, useCallback } from 'react';
import { authApi, lineNotifyApi, avatarSrc } from '@/lib/api';

const LINE_OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID ?? '';

interface User {
  id: number;
  username: string;
  role: string;
  avatarFilename: string | null;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const expired = remaining === 0;

  return (
    <span className={expired ? 'text-red-400' : 'text-amber-400'}>
      {expired ? 'หมดอายุแล้ว' : `หมดอายุใน ${m}:${String(s).padStart(2, '0')}`}
    </span>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lineLinked, setLineLinked] = useState(false);
  const [regToken, setRegToken] = useState<string | null>(null);
  const [regExpiry, setRegExpiry] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await lineNotifyApi.getStatus();
      setLineLinked(res.data.linked);
    } catch {}
  }, []);

  useEffect(() => {
    authApi.me().then(r => setUser(r.data)).catch(() => {});
    loadStatus();
  }, [loadStatus]);

  async function handleGenerateToken() {
    setTokenLoading(true);
    try {
      const res = await lineNotifyApi.generateToken();
      setRegToken(res.data.token);
      setRegExpiry(res.data.expiresAt);
    } catch {}
    setTokenLoading(false);
  }

  async function handleUnlink() {
    setUnlinkLoading(true);
    try {
      await lineNotifyApi.unlink();
      setLineLinked(false);
      setRegToken(null);
      setRegExpiry(null);
    } catch {}
    setUnlinkLoading(false);
  }

  async function handleCopy() {
    if (!regToken) return;
    await navigator.clipboard.writeText(regToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-bold text-black">Profile & Settings</h1>

        {/* User Info */}
        <div className="bg-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-700 flex items-center justify-center">
            {user?.avatarFilename && !imgError ? (
              <img
                src={`${avatarSrc(user.id)}?v=${encodeURIComponent(user.avatarFilename)}`}
                alt={user.username}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-slate-300">
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{user?.username ?? '...'}</div>
            <div className="text-slate-300 text-sm capitalize">{user?.role}</div>
          </div>
        </div>

        {/* LINE Notification */}
        <div className="bg-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#06C755">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            <h2 className="text-white font-semibold">LINE Notification</h2>
            {lineLinked && (
              <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                เชื่อมต่อแล้ว
              </span>
            )}
          </div>

          {lineLinked ? (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">
                บัญชีของคุณเชื่อมต่อกับ LINE แล้ว คุณจะได้รับแจ้งเตือนเมื่อมีการ @mention, มอบหมาย Issue หรือสถานะเปลี่ยนแปลง
              </p>
              <button
                onClick={handleUnlink}
                disabled={unlinkLoading}
                className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
              >
                {unlinkLoading ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ LINE'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                เชื่อมต่อบัญชีกับ LINE เพื่อรับแจ้งเตือนเมื่อมีการ @mention, มอบหมาย Issue หรือสถานะเปลี่ยนแปลง
              </p>

              {/* Step 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white flex-shrink-0">1</span>
                  เพิ่มเพื่อน LINE Official Account
                </div>
                {LINE_OA_ID ? (
                  <a
                    href={`https://line.me/R/ti/p/@${LINE_OA_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-medium rounded-lg transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    เพิ่มเพื่อน LINE OA
                  </a>
                ) : (
                  <p className="text-amber-400 text-xs">กรุณาตั้งค่า NEXT_PUBLIC_LINE_OA_ID ใน .env.local</p>
                )}
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white flex-shrink-0">2</span>
                  สร้างรหัส Register
                </div>
                <button
                  onClick={handleGenerateToken}
                  disabled={tokenLoading}
                  className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                >
                  {tokenLoading ? 'กำลังสร้าง...' : regToken ? 'สร้างรหัสใหม่' : 'สร้างรหัส Register'}
                </button>

                {regToken && regExpiry && (
                  <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-mono font-bold tracking-[0.3em] text-white select-all">
                        {regToken}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                      >
                        {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">
                      <CountdownTimer expiresAt={regExpiry} />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3 */}
              {regToken && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white flex-shrink-0">3</span>
                    ส่งรหัสใน LINE
                  </div>
                  <p className="text-slate-300 text-sm ml-7">
                    เปิดแชทกับ LINE OA แล้วพิมพ์รหัส <span className="font-mono text-white">{regToken}</span> แล้วส่ง
                    ระบบจะเชื่อมต่อบัญชีของคุณโดยอัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification types info */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-slate-300 text-sm font-medium mb-3">การแจ้งเตือนที่จะได้รับผ่าน LINE</h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span>💬</span> เมื่อมีคนกล่าวถึงคุณ (@mention) ในคอมเมนต์</li>
            <li className="flex items-start gap-2"><span>🔧</span> เมื่อได้รับมอบหมายเป็น Developer ใน Issue</li>
            <li className="flex items-start gap-2"><span>🧪</span> เมื่อได้รับมอบหมายเป็น Tester ใน Issue</li>
            <li className="flex items-start gap-2"><span>📋</span> เมื่อ Task Status ของ Issue ที่คุณเกี่ยวข้องเปลี่ยนแปลง</li>
            <li className="flex items-start gap-2"><span>🚀</span> เมื่อ Deployment Status ของ Issue ที่คุณเกี่ยวข้องเปลี่ยนแปลง</li>
          </ul>
        </div>
      </div>
    </>
  );
}
