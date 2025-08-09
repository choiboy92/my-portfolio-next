import './globals.css'
import Link from 'next/link'
import { MailIcon, GithubIcon, InstagramIcon, LinkedinIcon} from '@/components/icons'

export const metadata = {
  title: 'Junho Choi - Portfolio',
  description: 'Mechanical Engineering student and Product Manager portfolio showcasing projects in design, machine learning, and web development',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white font-jost">
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="flex w-full bg-black items-center justify-center flex-wrap border-b border-gray-800">
            <Link href="/" className="flex justify-center text-white no-underline flex-1 min-w-[500px] text-lg font-black hover:text-green-400 transition-colors">
              <h1 className="m-0 font-black font-shippori">
                <span className="px-4 shadow-[inset_0_-15px_0_0_#96c8a2]">
                  junho choi
                </span>
              </h1>
            </Link>
            <Link href="/currentwork" className="flex justify-center text-white no-underline flex-none w-[300px] text-sm hover:text-green-400 transition-colors">
              <h1 className="font-light text-xl">ongoing work</h1>
            </Link>
            <Link href="/hobbies" className="flex justify-center text-white no-underline flex-none w-[300px] text-sm hover:text-green-400 transition-colors">
              <h1 className="font-light text-xl">hobbies</h1>
            </Link>
            <Link href="/about" className="flex justify-center text-white no-underline flex-none w-[300px] text-sm hover:text-green-400 transition-colors">
              <h1 className="font-light text-xl">about me</h1>
            </Link>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="flex w-full bg-black mt-auto pt-2.5 pb-2.5 flex-wrap border-t border-gray-800">
            <p className="w-full pl-25 text-xs my-auto mb-0.5 border-b border-gray-600 text-gray-400">
              CONTACT ME
            </p>
            <a 
              href='mailto:junho.choi.imp@gmail.com' 
              className="flex-1 text-gray-500 border-l border-r border-gray-600 flex justify-center items-center py-2 hover:text-white transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <MailIcon className="h-7 w-7"/>
            </a>
            <a 
              href='https://github.com/choiboy92' 
              className="flex-1 text-gray-500 border-l border-r border-gray-600 flex justify-center items-center py-2 hover:text-white transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <GithubIcon className="h-7 w-7"/>
            </a>
            <a 
              href='https://www.linkedin.com/in/junho-c-b2461bb2/' 
              className="flex-1 text-gray-500 border-l border-r border-gray-600 flex justify-center items-center py-2 hover:text-white transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <LinkedinIcon className="h-7 w-7"/>
            </a>
            <a 
              href='https://www.instagram.com/junho.what/' 
              className="flex-1 text-gray-500 border-l border-r border-gray-600 flex justify-center items-center py-2 hover:text-white transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <InstagramIcon className="h-7 w-7"/>
            </a>
          </footer>
        </div>
      </body>
    </html>
  )
}