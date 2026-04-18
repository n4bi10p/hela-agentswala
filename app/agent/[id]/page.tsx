"use client";

import Link from "next/link";
import { formatUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNavBar } from "@/components/TopNavBar";
import {
  activateAgent,
  fetchAgentActivationCount,
  fetchAgentById,
  getPublicContractAddresses,
  isAgentActivatedByUser,
  type AgentStruct
} from "@/lib/contracts";
import { approveHLUSD, connectWallet, ensureHeLaNetwork, getConnectedAccount, persistConnectedAccount } from "@/lib/wallet";
import { getAgentImage, parseConfigSchema, toAgentTypeLabel, type ConfigField } from "@/lib/agentUi";

function formatChainError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected blockchain error";
}

function buildDefaultForm(fields: ConfigField[]) {
  return fields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field.key] = "";
    return accumulator;
  }, {});
}

function renderField(
  field: ConfigField,
  value: string,
  onChange: (key: string, nextValue: string) => void
) {
  const className =
    "bg-surface-container border border-white/20 text-white placeholder-white/30 p-3 font-mono text-sm focus:outline-none focus:border-white transition-colors";

  if (field.inputType === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
        placeholder={field.placeholder}
        className={className}
        rows={4}
      />
    );
  }

  if (field.inputType === "select") {
    return (
      <select
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
        className={className}
      >
        <option value="">{field.placeholder}</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.inputType}
      value={value}
      onChange={(event) => onChange(field.key, event.target.value)}
      placeholder={field.placeholder}
      className={className}
    />
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = Number(params.id);

  const [agent, setAgent] = useState<AgentStruct | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [account, setAccount] = useState<string | null>(null);
  const [alreadyActivated, setAlreadyActivated] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const configFields = useMemo(() => parseConfigSchema(agent?.configSchema || ""), [agent?.configSchema]);

  useEffect(() => {
    setFormData(buildDefaultForm(configFields));
  }, [configFields]);

  useEffect(() => {
    let cancelled = false;

    async function syncWallet() {
      const current = await getConnectedAccount();
      if (!cancelled) {
        setAccount(current);
      }
    }

    async function loadAgent() {
      try {
        setIsLoading(true);
        setError(null);

        const [agentRecord, count] = await Promise.all([
          fetchAgentById(agentId),
          fetchAgentActivationCount(agentId)
        ]);

        if (cancelled) {
          return;
        }

        setAgent(agentRecord);
        setActiveCount(count);

        const current = await getConnectedAccount();
        if (cancelled) {
          return;
        }

        setAccount(current);

        if (current) {
          const active = await isAgentActivatedByUser(current, agentId);
          if (!cancelled) {
            setAlreadyActivated(active);
          }
        } else {
          setAlreadyActivated(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load agent");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAgent();
    syncWallet().catch(() => undefined);

    const handleWalletChanged = async () => {
      const current = await getConnectedAccount();
      if (cancelled) {
        return;
      }
      setAccount(current);
      if (current) {
        const active = await isAgentActivatedByUser(current, agentId).catch(() => false);
        if (!cancelled) {
          setAlreadyActivated(active);
        }
      } else {
        setAlreadyActivated(false);
      }
    };

    window.addEventListener("trovia:wallet-changed", handleWalletChanged as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener("trovia:wallet-changed", handleWalletChanged as EventListener);
    };
  }, [agentId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActivate = async () => {
    if (!agent) {
      return;
    }

    try {
      setIsActivating(true);
      setError(null);
      setStatusMessage("Checking wallet...");

      await ensureHeLaNetwork();
      const activeAccount = account || (await connectWallet());
      persistConnectedAccount(activeAccount);
      setAccount(activeAccount);

      const escrowAddress = getPublicContractAddresses().escrow;

      if (agent.priceHLUSD > 0n) {
        setStatusMessage("Approving HLUSD spend...");
        await approveHLUSD(escrowAddress, agent.priceHLUSD);
      }

      setStatusMessage("Submitting activation transaction...");
      await activateAgent(agentId, JSON.stringify(formData));

      setAlreadyActivated(true);
      setActiveCount((current) => current + 1);
      setStatusMessage("Agent activated successfully.");

      router.push("/dashboard");
    } catch (activationError) {
      setError(formatChainError(activationError));
      setStatusMessage(null);
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black">
        <TopNavBar />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <p className="font-mono text-sm uppercase text-white/60">Loading on-chain agent...</p>
        </div>
      </main>
    );
  }

  if (error && !agent) {
    return (
      <main className="min-h-screen bg-black">
        <TopNavBar />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="mb-4 font-headline text-4xl text-white">AGENT NOT AVAILABLE</h1>
            <p className="mb-6 font-mono text-xs text-white/60">{error}</p>
            <Link href="/marketplace" className="transition-colors hover:text-white/60">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!agent) {
    return null;
  }

  const price = Number(formatUnits(agent.priceHLUSD, 18));

  return (
    <main className="min-h-screen bg-black">
      <TopNavBar />

      <div className="mx-auto mt-24 grid max-w-7xl grid-cols-1 gap-8 p-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="h-96 w-full overflow-hidden border border-white/12 bg-surface-container-lowest">
            <img src={getAgentImage(agent.agentType)} alt={agent.name} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col gap-4 border border-white/12 p-6">
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Activation Count</p>
              <p className="font-headline text-4xl text-white">{activeCount}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Activation Price</p>
              <p className="font-headline text-4xl text-white">{price} HLUSD</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Status</p>
              <div className={`mt-2 flex items-center gap-2 ${agent.isActive ? "text-live-signal" : "text-white/20"}`}>
                <span className={`h-3 w-3 rounded-full ${agent.isActive ? "bg-live-signal" : "bg-white/20"}`}></span>
                <span className="font-mono text-sm uppercase">{agent.isActive ? "LIVE" : "IDLE"}</span>
              </div>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-white/60">Developer</p>
              <p className="mt-2 break-all font-mono text-xs text-white/80">{agent.developer}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase text-white/40">{toAgentTypeLabel(agent.agentType)} AGENT</p>
            <h1 className="mb-4 font-headline text-6xl uppercase text-white">{agent.name}</h1>
            <p className="text-sm uppercase leading-relaxed text-white/60">{agent.description}</p>
          </div>

          <div className="flex flex-col gap-6 border border-white/12 p-6">
            <h2 className="font-headline text-2xl uppercase text-white">Configuration</h2>

            <div className="flex flex-col gap-4">
              {configFields.map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <label className="font-mono text-xs uppercase text-white/60">{field.label}</label>
                  {renderField(field, formData[field.key] || "", handleInputChange)}
                </div>
              ))}
            </div>

            {account && (
              <p className="font-mono text-xs uppercase text-white/40">
                Connected Wallet: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            )}

            {alreadyActivated && (
              <div className="border border-live-signal/40 bg-live-signal/5 p-4">
                <p className="font-mono text-xs uppercase text-live-signal">
                  This wallet has already activated this agent.
                </p>
              </div>
            )}

            {statusMessage && <p className="font-mono text-xs uppercase text-white/50">{statusMessage}</p>}

            {error && <p className="font-mono text-xs uppercase text-red-400">{error}</p>}

            <button
              onClick={handleActivate}
              disabled={isActivating || alreadyActivated || !agent.isActive}
              className="w-full border border-white bg-white py-4 font-headline text-xl uppercase text-black transition-colors hover:border-white hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isActivating ? "ACTIVATING..." : alreadyActivated ? "[ ALREADY ACTIVE ]" : "[ ACTIVATE ↗ ]"}
            </button>

            <Link
              href="/marketplace"
              className="w-full border border-white py-4 text-center font-headline text-xl uppercase text-white transition-colors hover:bg-white hover:text-black"
            >
              [ BACK ↗ ]
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
