/**
 * Custom hook for Daimo Pay integration with PNS domain registration
 * Handles payments from any coin on any chain to USDC on Polygon for domain registration
 */
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getAddress } from 'viem';
import { useDaimoPay, useDaimoPayUI } from '@daimo/pay';
import type { PaymentStartedEvent, PaymentCompletedEvent } from '@daimo/pay-common';
import { DAIMO_CONFIG, POLYGON_USDC, formatUsdcForDaimo, getRecipientAddress } from '../config/daimoConfig';
import { useDomain } from './useDomain';
import { recordTransaction } from '../services/dbService';

export interface DomainPaymentState {
  paymentId: string | null;
  isPaying: boolean;
  isComplete: boolean;
  txHash: string | null;
  error: string | null;
  registrationInProgress: boolean;
}

export interface DomainRegistrationPayment {
  domainName: string;
  durationYears: number;
  priceUsd: string;
  owner: string;
}

export function useDaimoPayDomain() {
  const { address, chainId } = useAccount();
  const { order } = useDaimoPay();
  const { resetPayment } = useDaimoPayUI();
  const { register: registerDomain } = useDomain();

  const [paymentState, setPaymentState] = useState<DomainPaymentState>({
    paymentId: null,
    isPaying: false,
    isComplete: false,
    txHash: null,
    error: null,
    registrationInProgress: false,
  });

  const [pendingRegistration, setPendingRegistration] = useState<DomainRegistrationPayment | null>(null);

  /**
   * Reset payment state
   */
  const resetState = useCallback(() => {
    setPaymentState({
      paymentId: null,
      isPaying: false,
      isComplete: false,
      txHash: null,
      error: null,
      registrationInProgress: false,
    });
    setPendingRegistration(null);
  }, []);

  /**
   * Handle payment started event
   * This is called when user initiates payment from Daimo Pay modal
   */
  const handlePaymentStarted = useCallback((event: PaymentStartedEvent, registration: DomainRegistrationPayment) => {
    console.log('[Daimo] Payment started:', event);
    setPaymentState(prev => ({
      ...prev,
      paymentId: event.paymentId,
      isPaying: true,
      error: null,
    }));
    setPendingRegistration(registration);
  }, []);

  /**
   * Handle payment completed event
   * This is called when payment is successful on-chain
   * We then trigger the domain registration
   */
  const handlePaymentCompleted = useCallback(async (event: PaymentCompletedEvent) => {
    console.log('[Daimo] Payment completed:', event);
    
    if (!pendingRegistration) {
      console.error('[Daimo] No pending registration found');
      setPaymentState(prev => ({
        ...prev,
        error: 'No pending registration found',
        isPaying: false,
      }));
      return;
    }

    setPaymentState(prev => ({
      ...prev,
      txHash: event.txHash,
      registrationInProgress: true,
    }));

    try {
      // Record the payment transaction (using 'register' type as payment is part of registration)
      await recordTransaction({
        txHash: event.txHash,
        type: 'register',
        domainName: pendingRegistration.domainName,
        owner: pendingRegistration.owner,
        chainId: event.chainId,
        timestamp: Date.now(),
        metadata: {
          paymentId: event.paymentId,
          amount: pendingRegistration.priceUsd,
          duration: pendingRegistration.durationYears,
          paymentMethod: 'daimo',
          step: 'payment',
        },
      });

      // Now register the domain on-chain
      console.log('[Daimo] Registering domain:', pendingRegistration.domainName);
      const result = await registerDomain(
        pendingRegistration.domainName,
        pendingRegistration.owner,
        pendingRegistration.durationYears
      );

      if (result?.success && result.txHash) {
        console.log('[Daimo] Domain registered successfully:', result.txHash);
        
        // Record the registration transaction
        await recordTransaction({
          txHash: result.txHash,
          type: 'register',
          domainName: pendingRegistration.domainName,
          owner: pendingRegistration.owner,
          chainId: chainId || 137,
          timestamp: Date.now(),
          metadata: {
            duration: pendingRegistration.durationYears,
            price: pendingRegistration.priceUsd,
            paymentTxHash: event.txHash,
            paymentId: event.paymentId,
          },
        });

        setPaymentState(prev => ({
          ...prev,
          isComplete: true,
          isPaying: false,
          registrationInProgress: false,
        }));
      } else {
        throw new Error(result?.error || 'Domain registration failed');
      }
    } catch (error) {
      console.error('[Daimo] Error during registration:', error);
      setPaymentState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed after payment',
        isPaying: false,
        registrationInProgress: false,
      }));
    }
  }, [pendingRegistration, registerDomain, chainId]);

  /**
   * Prepare Daimo Pay button props for domain registration
   */
  const prepareDaimoPayProps = useCallback((
    domainName: string,
    priceUsd: string,
    durationYears: number,
    owner?: string
  ) => {
    if (!address && !owner) {
      throw new Error('Wallet not connected');
    }

    const recipientAddress = getRecipientAddress(chainId || 137);
    const registration: DomainRegistrationPayment = {
      domainName,
      durationYears,
      priceUsd,
      owner: owner || address!,
    };

    return {
      appId: DAIMO_CONFIG.appId,
      toChain: POLYGON_USDC.chainId,
      toToken: getAddress(POLYGON_USDC.token),
      toAddress: recipientAddress,
      toUnits: formatUsdcForDaimo(priceUsd),
      intent: 'Register' as const,
      preferredChains: DAIMO_CONFIG.preferredChains,
      preferredTokens: DAIMO_CONFIG.preferredTokens,
      onPaymentStarted: (event: PaymentStartedEvent) => handlePaymentStarted(event, registration),
      onPaymentCompleted: handlePaymentCompleted,
    };
  }, [address, chainId, handlePaymentStarted, handlePaymentCompleted]);

  /**
   * Reset payment for a new transaction
   */
  const resetForNewPayment = useCallback((
    priceUsd: string
  ) => {
    resetState();
    resetPayment({
      toChain: POLYGON_USDC.chainId,
      toAddress: getRecipientAddress(chainId || 137),
      toToken: getAddress(POLYGON_USDC.token),
      toUnits: formatUsdcForDaimo(priceUsd),
    });
  }, [chainId, resetState, resetPayment]);

  return {
    paymentState,
    prepareDaimoPayProps,
    resetState,
    resetForNewPayment,
    order, // Expose order from useDaimoPay for additional info
  };
}
