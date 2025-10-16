import React, { useState } from 'react'

interface LoginProps {
    login: (username: string, password: string) => void
}

const Login = (props: LoginProps) => {
    const [username, setUsername] = useState('alice')
    const [password, setPassword] = useState('1')
    const [inProgress, setInProgress] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClick = (e: React.MouseEvent) => {
        setInProgress(true)
        props.login(username, password)
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    return <>
        <h1>Login</h1>
        <div>
            <label htmlFor='username'>Username:</label>
            <input
                type='text'
                id='username'
                value={username}
                onChange={handleUsernameChange}
            />
        </div>
        <div>
            <label htmlFor='password'>Password:</label>
            <input
                type='password'
                id='password'
                value={password}
                onChange={handlePasswordChange}
            />
        </div>
        <button onClick={handleClick} disabled={inProgress}>Login</button>
    </>
}

export default Login