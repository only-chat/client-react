type MessageResponseType = MessageResponse['type']

type MessageResponseData = ConversationClosedData | ConversationDeletedData | ConversationUpdatedData | MessageDeletedData | MessageUpdatedData | FileMessageData | TextMessageData | null

export interface Message {
    id?: string
    conversationId: string
    participants: string[]
    connectionId: string
    fromId: string
    type: MessageResponseType
    data: MessageResponseData
    createdAt: Date
    updatedAt?: Date
    deletedAt?: Date
}

export interface Conversation {
    id: string
    clientConversationId?: string
    title?: string
    participants: string[]
    createdBy: string
    createdAt: Date
    updatedAt?: Date
    closedAt?: Date
    deletedAt?: Date
    latestMessage?: Message
    leftAt?: Date
}

interface ConversationData {
    id?: string
    title?: string
    participants: string[]
    createdBy: string
    createdAt: string
    updatedAt?: string
    closedAt?: string
    deletedAt?: string
}

interface ConversationResponse {
    conversation: ConversationData
    leftAt?: Date
    latestMessage?: MessageResponse
    connected: string[]
}

interface ConversationClosedData {
    conversationId: string
    closedAt: string
}

export interface LoadedConversationsResponse {
    type: 'loaded'
    conversations: ConversationResponse[]
    count: number
}

export interface LoadedMessagesResponse {
    type: 'loaded-messages'
    messages: MessageResponse[]
    count: number
}

export type ServerResponse = LoadedConversationsResponse | LoadedMessagesResponse

interface ServerMessageResponse {
    id?: string
    conversationId: string
    participants: string[]
    connectionId: string
    fromId: string
    type: MessageResponseType
    data: MessageResponseData
    createdAt: string
    updatedAt?: string
    deletedAt?: string
}

export interface ConversationClosedResponse extends ServerMessageResponse {
    type: 'closed'
    data: ConversationClosedData
}

interface ConversationDeletedData {
    conversationId: string
    closedAt: string
    deletedAt: string
}

export interface ConversationDeletedResponse extends ServerMessageResponse {
    type: 'deleted'
    data: ConversationDeletedData
}

interface ConversationUpdatedData {
    conversationId: string
    title?: string
    participants: string[]
    updatedAt: string
}

export interface ConversationUpdatedResponse extends ServerMessageResponse {
    type: 'updated'
    data: ConversationUpdatedData
}

interface MessageDeletedData {
    messageId: string
    deletedAt: string
}

interface FileMessageData {
    link: string
    name: string
    type: string
    size: number
}

interface TextMessageData {
    text: string
}

interface MessageUpdatedData extends FileMessageData, TextMessageData {
    messageId: string
    updatedAt: string
}

export interface TextMessageResponse extends ServerMessageResponse {
    type: 'text'
    data: TextMessageData
}

export interface FileMessageResponse extends ServerMessageResponse {
    type: 'file'
    data: FileMessageData
}

export interface MessageDeletedResponse extends ServerMessageResponse {
    type: 'message-deleted'
    data: MessageDeletedData
}

export interface MessageUpdatedResponse extends ServerMessageResponse {
    type: 'message-updated'
    data: MessageUpdatedData
}

export interface JoinedResponse extends ServerMessageResponse {
    type: 'joined'
    data: null
}

export interface LeftResponse extends ServerMessageResponse {
    type: 'left'
    data: null
}

export type MessageResponse = ConversationClosedResponse | ConversationDeletedResponse | ConversationUpdatedResponse | JoinedResponse | LeftResponse | MessageDeletedResponse | MessageUpdatedResponse | TextMessageResponse | FileMessageResponse

export const createMessage = (response: ServerMessageResponse) => ({
    id: response.id,
    conversationId: response.conversationId,
    participants: response.participants,
    connectionId: response.connectionId,
    fromId: response.fromId,
    type: response.type,
    data: response.data,
    createdAt: new Date(response.createdAt),
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined,
    deletedAt: response.deletedAt ? new Date(response.deletedAt) : undefined,
} as Message)

export const createConversation = (response: ConversationResponse) => ({
    id: response.conversation.id,
    title: response.conversation.title,
    participants: response.conversation.participants,
    createdBy: response.conversation.createdBy,
    createdAt: new Date(response.conversation.createdAt),
    updatedAt: response.conversation.updatedAt ? new Date(response.conversation.updatedAt) : undefined,
    closedAt: response.conversation.closedAt ? new Date(response.conversation.closedAt) : undefined,
    deletedAt: response.conversation.deletedAt ? new Date(response.conversation.deletedAt) : undefined,
    latestMessage: response.latestMessage ? createMessage(response.latestMessage) : undefined,
    leftAt: response.leftAt ? new Date(response.leftAt) : undefined,
    connected: response.connected,
} as Conversation)