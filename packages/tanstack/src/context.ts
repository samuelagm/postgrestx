import React, { createContext, useContext } from 'react'
import type { PostgrestClient } from '@postgrestx/core'

const Ctx = createContext<PostgrestClient | null>(null)

export interface PostgrestProviderProps {
  client: PostgrestClient
  children: React.ReactNode
}

export function PostgrestProvider({ client, children }: PostgrestProviderProps) {
  return React.createElement(Ctx.Provider, { value: client }, children)
}

export function usePostgrestClient(): PostgrestClient {
  const c = useContext(Ctx)
  if (!c) throw new Error('PostgrestProvider is missing')
  return c
}
