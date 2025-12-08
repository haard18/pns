/**
 * Example: Adding Daimo Pay to Domain Renewal Page
 * 
 * This file shows how to integrate Daimo Pay for domain renewals
 * following the same pattern as domain registration.
 * 
 * All emojis replaced with SVG icons.
 */

import { useState, useEffect, useCallback } from 'react';
import { DaimoPayButton } from '@daimo/pay';
import { useDaimoPayDomain } from '../hooks/useDaimoPayDomain';
import { useDomain } from '../hooks/useDomain';
import { useAccount } from 'wagmi';
import { useParams, useNavigate } from 'react-router-dom';
import { getAddress } from 'viem';
import type { PaymentCompletedEvent, PaymentStartedEvent } from '@daimo/pay-common';
import { DAIMO_CONFIG, POLYGON_USDC, formatUsdcForDaimo, getRecipientAddress } from '../config/daimoConfig';
import { recordTransaction } from '../services/dbService';

// Icon components (replace emojis)
const CheckCircleIcon = () => (
  <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationCircleIcon = () => (
  <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// =========================================================================
// 1. SIMPLE EXAMPLE: Using existing useDaimoPayDomain hook
// =========================================================================

export function RenewDomainExample() {
  const { address } = useAccount();
  const { getPrice } = useDomain();
  const { paymentState, prepareDaimoPayProps } = useDaimoPayDomain();
  
  const [selectedDomain, ] = useState('example.poly');
  const [years, setYears] = useState(1);
  const [price, setPrice] = useState('0');

  // Fetch renewal price
  useEffect(() => {
    if (selectedDomain) {
      getPrice(selectedDomain, years).then(priceData => {
        if (priceData) setPrice(priceData.price);
      });
    }
  }, [selectedDomain, years, getPrice]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Renew {selectedDomain}</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Years to renew:</label>
        <input 
          type="number" 
          value={years} 
          onChange={(e) => setYears(parseInt(e.target.value))}
          min={1}
          max={10}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-lg">Price: {price} USDC for {years} year(s)</p>
      </div>

      {address && price !== '0' && (
        <div className="mb-4">
          <DaimoPayButton
            {...prepareDaimoPayProps(
              selectedDomain.replace(/\.poly$/i, ''),
              price,
              years,
              address
            )}
          />
        </div>
      )}

      {paymentState.isPaying && (
        <div className="flex items-center text-blue-600 mb-4">
          <LoadingIcon />
          <span>Processing payment...</span>
        </div>
      )}
      
      {paymentState.registrationInProgress && (
        <div className="flex items-center text-blue-600 mb-4">
          <LoadingIcon />
          <span>Renewing domain on-chain...</span>
        </div>
      )}
      
      {paymentState.isComplete && (
        <div className="flex items-center text-green-600 p-3 bg-green-50 rounded mb-4">
          <CheckCircleIcon />
          <span>Domain renewed successfully!</span>
        </div>
      )}
      
      {paymentState.error && (
        <div className="flex items-center text-red-600 p-3 bg-red-50 rounded mb-4">
          <ExclamationCircleIcon />
          <span>Error: {paymentState.error}</span>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. CUSTOM HOOK: Specialized hook for renewals
// =========================================================================

interface RenewalPaymentData {
  domainName: string;
  durationYears: number;
  priceUsd: string;
  owner: string;
}

export function useDaimoPayRenewal() {
  const { address, chainId } = useAccount();
  const { renew: renewDomain } = useDomain();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRenewal, setPendingRenewal] = useState<RenewalPaymentData | null>(null);

  const handleRenewalPaymentStarted = useCallback((
    event: PaymentStartedEvent,
    renewal: RenewalPaymentData
  ) => {
    console.log('[Daimo Renewal] Payment started:', event);
    setPendingRenewal(renewal);
  }, []);

  const handleRenewalPaymentCompleted = useCallback(async (
    event: PaymentCompletedEvent
  ) => {
    if (!pendingRenewal) {
      console.error('[Daimo Renewal] No pending renewal found');
      setError('No pending renewal found');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Record payment transaction
      await recordTransaction({
        txHash: event.txHash,
        type: 'renew',
        domainName: pendingRenewal.domainName,
        owner: pendingRenewal.owner,
        chainId: event.chainId,
        timestamp: Date.now(),
        metadata: {
          paymentId: event.paymentId,
          amount: pendingRenewal.priceUsd,
          duration: pendingRenewal.durationYears,
          paymentMethod: 'daimo',
          step: 'payment',
        },
      });

      // Call renew function after payment completes
      console.log('[Daimo Renewal] Renewing domain:', pendingRenewal.domainName);
      await renewDomain(pendingRenewal.domainName, pendingRenewal.durationYears);
      
      console.log('[Daimo Renewal] Domain renewed successfully');
    } catch (err) {
      console.error('[Daimo Renewal] Error during renewal:', err);
      setError(err instanceof Error ? err.message : 'Renewal failed');
    } finally {
      setIsProcessing(false);
    }
  }, [pendingRenewal, renewDomain]);

  const prepareRenewalPayProps = useCallback((
    domainName: string,
    priceUsd: string,
    years: number,
    owner?: string
  ) => {
    if (!address && !owner) {
      throw new Error('Wallet not connected');
    }

    const recipientAddress = getRecipientAddress(chainId || 137);
    const renewal: RenewalPaymentData = {
      domainName,
      durationYears: years,
      priceUsd,
      owner: owner || address!,
    };

    return {
      appId: DAIMO_CONFIG.appId,
      toChain: POLYGON_USDC.chainId,
      toToken: getAddress(POLYGON_USDC.token),
      toAddress: recipientAddress,
      toUnits: formatUsdcForDaimo(priceUsd),
      intent: 'Renew' as const,
      preferredChains: DAIMO_CONFIG.preferredChains,
      preferredTokens: DAIMO_CONFIG.preferredTokens,
      onPaymentStarted: (event: PaymentStartedEvent) => 
        handleRenewalPaymentStarted(event, renewal),
      onPaymentCompleted: handleRenewalPaymentCompleted,
    };
  }, [address, chainId, handleRenewalPaymentStarted, handleRenewalPaymentCompleted]);

  const resetRenewalState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setPendingRenewal(null);
  }, []);

  return {
    prepareRenewalPayProps,
    isProcessing,
    error,
    resetRenewalState,
  };
}

// =========================================================================
// 3. REAL IMPLEMENTATION: ManageDomain with Renewal Flow
// =========================================================================

export function ManageDomainWithRenewal() {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { getPrice } = useDomain();
  const { prepareRenewalPayProps, isProcessing, error } = useDaimoPayRenewal();
  
  const [years, setYears] = useState(1);
  const [price, setPrice] = useState('0');
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch renewal price
  useEffect(() => {
    if (domainName) {
      setLoadingPrice(true);
      getPrice(domainName, years)
        .then(priceData => {
          if (priceData) setPrice(priceData.price);
        })
        .catch(err => console.error('Error fetching price:', err))
        .finally(() => setLoadingPrice(false));
    }
  }, [domainName, years, getPrice]);

  // Redirect after successful renewal
  useEffect(() => {
    if (!isProcessing && !error && price !== '0') {
      const timer = setTimeout(() => {
        navigate('/profile');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, error, price, navigate]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manage {domainName}</h1>
      
      <section className="border border-gray-200 rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-6">Renew Domain</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Renewal Duration (Years)
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setYears(Math.max(1, years - 1))}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-2xl font-bold w-12 text-center">{years}</span>
            <button
              onClick={() => setYears(Math.min(10, years + 1))}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Renewal Cost:</span>
            <span className="text-2xl font-bold text-blue-600">
              {loadingPrice ? 'Loading...' : `${price} USDC`}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            For {years} year{years > 1 ? 's' : ''}
          </p>
        </div>
        
        {address && price !== '0' && domainName && (
          <div className="mb-4">
            <DaimoPayButton
              {...prepareRenewalPayProps(domainName, price, years, address)}
            />
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center text-blue-600 p-3 bg-blue-50 rounded">
            <LoadingIcon />
            <span>Processing renewal...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center text-red-600 p-3 bg-red-50 rounded">
            <ExclamationCircleIcon />
            <span>Error: {error}</span>
          </div>
        )}

        {!isProcessing && !error && price !== '0' && (
          <div className="flex items-center text-green-600 p-3 bg-green-50 rounded">
            <CheckCircleIcon />
            <span>Ready to renew - redirecting to profile...</span>
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================================
// 4. BULK RENEWALS: Renew multiple domains at once
// =========================================================================

interface BulkDomain {
  name: string;
  price: string;
  isChecked: boolean;
}

export function BulkRenewal() {
  const { address, chainId } = useAccount();
  const { renew: renewDomain } = useDomain();
  const [domains, setDomains] = useState<BulkDomain[]>([
    { name: 'example1.poly', price: '10.00', isChecked: true },
    { name: 'example2.poly', price: '10.00', isChecked: true },
    { name: 'example3.poly', price: '15.00', isChecked: false },
  ]);
  const [years, setYears] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const selectedDomains = domains.filter(d => d.isChecked);
  const totalPrice = selectedDomains.reduce((sum, d) => sum + parseFloat(d.price), 0);

  const handleBulkPaymentCompleted = async (event: PaymentCompletedEvent) => {
    setIsProcessing(true);
    setError(null);
    setSuccessCount(0);

    try {
      // Record bulk payment
      await recordTransaction({
        txHash: event.txHash,
        type: 'renew',
        domainName: selectedDomains.map(d => d.name).join(','),
        owner: address!,
        chainId: event.chainId,
        timestamp: Date.now(),
        metadata: {
          paymentId: event.paymentId,
          amount: totalPrice.toFixed(2),
          duration: years,
          paymentMethod: 'daimo',
          bulkCount: selectedDomains.length,
        },
      });

      // Renew each domain
      for (const domain of selectedDomains) {
        try {
          await renewDomain(domain.name.replace(/\.poly$/i, ''), years);
          setSuccessCount(prev => prev + 1);
          console.log(`Renewed: ${domain.name}`);
        } catch (err) {
          console.error(`Failed to renew ${domain.name}:`, err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk renewal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDomain = (index: number) => {
    setDomains(prev => prev.map((d, i) => 
      i === index ? { ...d, isChecked: !d.isChecked } : d
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Bulk Domain Renewal</h2>
      
      <div className="mb-6 border rounded-lg overflow-hidden">
        {domains.map((domain, index) => (
          <div 
            key={domain.name}
            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={domain.isChecked}
                onChange={() => toggleDomain(index)}
                className="w-4 h-4"
              />
              <span className="font-medium">{domain.name}</span>
            </div>
            <span className="text-gray-600">{domain.price} USDC</span>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Years to renew:</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setYears(Math.max(1, years - 1))}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            -
          </button>
          <span className="text-xl font-bold w-12 text-center">{years}</span>
          <button
            onClick={() => setYears(Math.min(10, years + 1))}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <span>Selected Domains:</span>
          <span className="font-bold">{selectedDomains.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Total Cost:</span>
          <span className="text-2xl font-bold text-blue-600">
            {totalPrice.toFixed(2)} USDC
          </span>
        </div>
      </div>
      
      {address && selectedDomains.length > 0 && (
        <DaimoPayButton
          appId={DAIMO_CONFIG.appId}
          toChain={POLYGON_USDC.chainId}
          toToken={getAddress(POLYGON_USDC.token)}
          toAddress={getRecipientAddress(chainId || 137)}
          toUnits={totalPrice.toFixed(2)}
          intent="Renew"
          preferredChains={DAIMO_CONFIG.preferredChains}
          preferredTokens={DAIMO_CONFIG.preferredTokens}
          onPaymentCompleted={handleBulkPaymentCompleted}
        />
      )}

      {isProcessing && (
        <div className="mt-4 flex items-center text-blue-600 p-3 bg-blue-50 rounded">
          <LoadingIcon />
          <span>Renewing domains... ({successCount}/{selectedDomains.length})</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center text-red-600 p-3 bg-red-50 rounded">
          <ExclamationCircleIcon />
          <span>Error: {error}</span>
        </div>
      )}

      {!isProcessing && successCount > 0 && (
        <div className="mt-4 flex items-center text-green-600 p-3 bg-green-50 rounded">
          <CheckCircleIcon />
          <span>Successfully renewed {successCount} domain(s)!</span>
        </div>
      )}
    </div>
  );
}
