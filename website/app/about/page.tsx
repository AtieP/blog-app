

export default function AboutPage() {
    return (
        <div className="max-w-1/2 w-1/2 mx-auto">
            <h1 className="text-5xl">About this site</h1>
            <p className="py-4 text-lg">This is a very simple blog site made by <a className="text-blue-950" href="https://github.com/AtieP">Daniel Paziyski (AtieP)</a>. Powered by:</p>
            <ul className="list-disc text-lg">
                <li className="mb-4">Backend
                    <ul className="ml-4">
                        <li>Language: TypeScript</li>
                        <li>Software: express.js, yup, AWS (DynamoDB for the database, Cognito for authentication, S3 for media storage, EC2 + Docker compose for running the app, Lambda for handling user creation)</li>
                    </ul>
                </li>
                <li>Frontend
                    <ul className="ml-4">
                        <li>Language: TypeScript</li>
                        <li>Software: next.js, React, tailwind CSS</li>
                    </ul>
                </li>
            </ul>
        </div>
    )
}