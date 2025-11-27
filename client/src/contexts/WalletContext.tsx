import type { FC, PropsWithChildren } from 'react'
import React, { createContext, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export interface WalletContextType {
  address: string | undefined
  isConnected: boolean
  isLoading: boolean
  connect: (wallet?: 'metamask' | 'phantom') => void
  disconnect: () => void
  chainId: number | undefined
  providerType?: 'EVM' | 'SOL' | 'NONE'
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)
  const [solanaAddress, setSolanaAddress] = useState<string | undefined>(undefined)
  const [providerType, setProviderType] = useState<'EVM' | 'SOL' | 'NONE'>('NONE')

  const handleConnect = async (wallet?: 'metamask' | 'phantom') => {
    try {
      setIsLoading(true)

      if (wallet === 'phantom') {
        // Phantom is a Solana wallet and not managed by wagmi. Connect via window.solana
        const anyWin = window as any
        if (anyWin?.solana && anyWin.solana.isPhantom) {
          try {
            const resp = await anyWin.solana.connect()
            setSolanaAddress(resp?.publicKey?.toString())
            setProviderType('SOL')
            return
          } catch (err) {
            console.error('Phantom connection error:', err)
            return
          }
        } else {
          console.warn('Phantom not available in this browser')
          return
        }
      }

      // Default: attempt EVM injected (MetaMask) connector
      const metamaskConnector = connectors.find((c) => /metamask|injected/i.test(c.name || c.id || '')) || connectors[0]
      if (metamaskConnector) {
        await connect({ connector: metamaskConnector })
        setProviderType('EVM')
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
        // Prefer EVM address when available, otherwise Solana address
        address: address?.toString() || solanaAddress,
        isConnected: isConnected || !!solanaAddress,
        isLoading,
        connect: handleConnect,
        disconnect: () => {
          try {
            if (providerType === 'SOL') {
              const anyWin = window as any
              anyWin?.solana?.disconnect?.()
              setSolanaAddress(undefined)
              setProviderType('NONE')
            } else {
              disconnect()
              setProviderType('NONE')
            }
          } catch (err) {
            console.error('Disconnect error:', err)
          }
        },
        chainId: chain?.id,
        providerType,
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

