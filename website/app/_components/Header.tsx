import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"


export default async function Header() {

    const username = cookies().get("username")

    return (
        <header className="bg-classy-3 min-h-20 max-h-20 h-20 mb-6 p-4 flex flex-row gap-4 select-none w-full max-w-full min-w-full overflow-auto">
            <h1 className="text-5xl">Blog</h1>
            <h2 className="ml-4 text-xl hover:text-white"><a href="/">Main</a></h2>
            <h2 className="text-xl hover:text-white"><a href="/newpost">New post</a></h2>
            <h2 className="text-xl hover:text-white"><a href="/about">About</a></h2>
            {!username ? 
                <h2 className="text-xl hover:text-white ml-auto"><Link href={process.env.NEXT_PUBLIC_AUTH_HOSTED_UI}><button>Authenticate</button></Link></h2>     
            :   <h2 className="text-xl hover:text-white ml-auto"><Link href={`/user/${username.value}`}><button>@{username.value}</button></Link></h2>}
        </header>
    )
}