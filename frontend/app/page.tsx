import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/ics-backoffice/login');
}
