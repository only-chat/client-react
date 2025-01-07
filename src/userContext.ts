import { createContext } from 'react'

export interface User {
    name?: string
}

const userContext = createContext<User>({})

export default userContext
