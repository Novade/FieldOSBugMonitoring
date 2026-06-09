import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLoginUrl } from '../../services/authService';
import Skyline from '../../assets/skyline.svg?react';
import LoginLogo from '../../assets/login_logo.svg?react';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState('');
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setErrorMsg(decodeURIComponent(err));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="relative z-10 bg-white rounded-md border border-[#dde2ea] shadow-sm p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <LoginLogo className="mx-auto" />
          <p className="text-xl text-[#5182BB] mt-1 mb-10">
            Bug Monitoring Dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 bg-[#fde8e8] border border-[#f5c6c6] rounded-md px-4 py-3 text-[13px] text-[#9b1c1c] text-left">
            {errorMsg}
          </div>
        )}

        <a
          href={getLoginUrl()}
          className="flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-3xl text-[14px] font-medium transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
            <path d="M15.12 14.26c-3.73-4.37-7.5-9.07-8.14-9.88a.47.47 0 0 0-.81.06L.15 16.6a.47.47 0 0 0 .42.67h9.36a.47.47 0 0 0 .42-.26c1.15-2.31 3.88-2.75 4.77-.75zM16.88 17.74c3.73 4.37 7.5 9.07 8.14 9.88a.47.47 0 0 0 .81-.06l6.02-12.16a.47.47 0 0 0-.42-.67h-9.36a.47.47 0 0 0-.42.26c-1.15 2.31-3.88 2.75-4.77.75z" />
          </svg>
          Continue with Atlassian
        </a>

        <p className="text-[13px] text-[#6b7a99] mt-4">
          Sign in with your Atlassian account to access the dashboard.
        </p>

        <p className="text-[11px] text-[#aab0bc] mt-5">
          Access restricted to Novade Jira users only.
        </p>
      </div>

      <Skyline
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full z-0"
        style={{ color: '#5182BB' }}
      />
    </div>
  );
}
