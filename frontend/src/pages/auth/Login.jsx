import { Button, Input } from '../../components/ui'

function Login() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 dark:bg-slate-900 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Login to your account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Track grievances, updates, and support messages in one place.
          </p>

          <form className="mt-8 space-y-4">
            <Input label="Email" type="email" placeholder="student@university.edu" required />
            <Input label="Password" type="password" placeholder="••••••••" required />
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            New student? <a href="/register" className="font-medium text-indigo-600 dark:text-indigo-300">Create account</a>
          </p>
        </div>
      </section>

      <section className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 lg:flex">
        <div className="absolute -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative max-w-md rounded-2xl border border-white/30 bg-white/10 p-8 text-white backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Unified Student Support</p>
          <h2 className="mt-3 text-3xl font-semibold">Transparent grievance resolution, faster than ever.</h2>
          <p className="mt-3 text-indigo-100">
            Submit requests, monitor progress, and communicate with support staff through a unified workflow.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Login