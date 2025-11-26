import type { FC, PropsWithChildren } from 'react'
import React, { createContext, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export interface WalletContextType {
  address: string | undefined
  isConnected: boolean
  isLoading: boolean
  connect: () => void
  disconnect: () => void
  chainId: number | undefined
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const connector = connectors[0]
      if (connector) {
        connect({ connector })
      }
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address: address?.toString(),
        isConnected,
        isLoading,
        connect: handleConnect,
        disconnect: () => disconnect(),
        chainId: chain?.id,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = React.useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

