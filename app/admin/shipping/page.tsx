'use client';

import { useState } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Clock,
  Settings,
  Plus,
  Edit2,
  Send,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CourierConfig, ShippingRule } from '@/lib/admin/adminTypes';

export default function ShippingAdminPage() {
  // Pincode Lookup State
  const [pincodeQuery, setPincodeQuery] = useState('');
  const [pincodeResult, setPincodeResult] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Shipping Rules State
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([
    {
      id: 'rule-standard',
      name: 'Standard Surface Shipping',
      minOrderAmount: 0,
      maxOrderAmount: 498,
      rate: 50,
      isFree: false,
      estimatedDays: '3-5 Business Days',
    },
    {
      id: 'rule-free',
      name: 'Free Express Tier (₹499+)',
      minOrderAmount: 499,
      rate: 0,
      isFree: true,
      estimatedDays: '2-4 Business Days',
    },
    {
      id: 'rule-express',
      name: 'Priority Air Express',
      minOrderAmount: 0,
      rate: 120,
      isFree: false,
      estimatedDays: '1-2 Business Days',
    },
  ]);

  // Courier Configs State
  const [couriers, setCouriers] = useState<CourierConfig[]>([
    {
      id: 'cour-delhivery',
      name: 'Delhivery Surface & Express',
      code: 'DELHIVERY',
      isActive: true,
      trackingUrlTemplate: 'https://www.delhivery.com/track/package/{awb}',
      apiConnected: true,
      serviceablePincodesCount: 19200,
    },
    {
      id: 'cour-shiprocket',
      name: 'Shiprocket Multi-Carrier Hub',
      code: 'SHIPROCKET',
      isActive: true,
      trackingUrlTemplate: 'https://shiprocket.co/tracking/{awb}',
      apiConnected: true,
      serviceablePincodesCount: 24000,
    },
    {
      id: 'cour-bluedart',
      name: 'BlueDart Aviation Express',
      code: 'BLUEDART',
      isActive: true,
      trackingUrlTemplate: 'https://www.bluedart.com/tracking?awb={awb}',
      apiConnected: true,
      serviceablePincodesCount: 14500,
    },
    {
      id: 'cour-dtdc',
      name: 'DTDC Courier Service',
      code: 'DTDC',
      isActive: false,
      trackingUrlTemplate: 'https://www.dtdc.in/tracking/{awb}',
      apiConnected: false,
      serviceablePincodesCount: 11000,
    },
  ]);

  // AWB Simulator State
  const [testAwb, setTestAwb] = useState('DLH-89217392');
  const [awbStatus, setAwbStatus] = useState<any | null>(null);

  const handlePincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincodeQuery.trim())) {
      toast.error('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setIsLookingUp(true);
    setTimeout(() => {
      const pin = pincodeQuery.trim();
      let city = 'Bengaluru';
      let state = 'Karnataka';
      if (pin.startsWith('11')) {
        city = 'New Delhi';
        state = 'Delhi';
      } else if (pin.startsWith('40')) {
        city = 'Mumbai';
        state = 'Maharashtra';
      } else if (pin.startsWith('70')) {
        city = 'Kolkata';
        state = 'West Bengal';
      } else if (pin.startsWith('60')) {
        city = 'Chennai';
        state = 'Tamil Nadu';
      }

      setPincodeResult({
        pincode: pin,
        city,
        state,
        isServiceable: true,
        codAvailable: true,
        estimatedDeliveryDays: '2-4 business days',
        courierHub: 'Delhivery Southern Sorting Hub (BLR-02)',
      });
      setIsLookingUp(false);
      toast.success(`PIN ${pin} verified: Serviceable!`);
    }, 300);
  };

  const handleTrackAwb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testAwb.trim()) return;

    setAwbStatus({
      awb: testAwb,
      courier: 'Delhivery Express',
      currentStatus: 'OUT_FOR_DELIVERY',
      destinationCity: 'Bengaluru, KA',
      events: [
        { time: 'Today, 09:30 AM', desc: 'Out for delivery with rider Vikram S.' },
        { time: 'Yesterday, 08:15 PM', desc: 'Arrived at local delivery center (Koramangala DC)' },
        { time: '2 days ago, 04:00 PM', desc: 'In transit from Central Fulfillment Hub' },
        { time: '3 days ago, 11:20 AM', desc: 'Manifest created and parcel picked up from Rangaroo warehouse' },
      ],
    });
    toast.success('AWB status fetched successfully');
  };

  const handleToggleCourier = (id: string, current: boolean) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
    );
    toast.success(`Courier ${!current ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Shipping & Logistics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Nationwide pincode serviceability check, courier integration rules, and airway bill (AWB) tracking.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-2xs">
          Free Shipping Threshold: ₹499
        </span>
      </div>

      {/* Top Grid: Pincode Lookup & AWB Tracking Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pincode Serviceability Lookup */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <MapPin className="w-4 h-4 text-[#C85A32]" />
            <div>
              <h2 className="text-base font-bold font-outfit text-stone-900">
                Pincode Serviceability Engine
              </h2>
              <p className="text-xs text-stone-500">
                Validate Indian PIN code delivery reach across partner couriers
              </p>
            </div>
          </div>

          <form onSubmit={handlePincodeSearch} className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={pincodeQuery}
              onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit PIN (e.g. 560001)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className="px-4 py-2.5 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              Verify Reach
            </button>
          </form>

          {/* Result Card */}
          {pincodeResult && (
            <div className="p-4 bg-[#FFF9F2] rounded-2xl border border-amber-900/10 space-y-2 text-xs animate-in fade-in-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-sm">
                  {pincodeResult.city}, {pincodeResult.state} ({pincodeResult.pincode})
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Serviceable
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-stone-600 pt-1">
                <div>
                  <span className="text-stone-400 block text-[10px]">Estimated Delivery</span>
                  <span className="font-semibold text-stone-800">{pincodeResult.estimatedDeliveryDays}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Sorting Facility Hub</span>
                  <span className="font-semibold text-stone-800 truncate block">{pincodeResult.courierHub}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live AWB Tracking Simulator */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Truck className="w-4 h-4 text-[#C85A32]" />
            <div>
              <h2 className="text-base font-bold font-outfit text-stone-900">
                AWB Tracking Simulator
              </h2>
              <p className="text-xs text-stone-500">
                Inspect package transit status and courier carrier telemetry
              </p>
            </div>
          </div>

          <form onSubmit={handleTrackAwb} className="flex gap-2">
            <input
              type="text"
              value={testAwb}
              onChange={(e) => setTestAwb(e.target.value.toUpperCase())}
              placeholder="Enter AWB Tracking ID..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono text-xs sm:text-sm uppercase font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              Track Parcel
            </button>
          </form>

          {/* Tracking Timeline */}
          {awbStatus && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs animate-in fade-in-0">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="font-mono font-bold text-stone-900">{awbStatus.awb}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                  {awbStatus.currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-2 pt-1 max-h-36 overflow-y-auto">
                {awbStatus.events.map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C85A32] mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-800">{ev.desc}</div>
                      <div className="text-[10px] text-stone-400">{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Rate Rules Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
          <div>
            <h3 className="font-outfit font-bold text-stone-900 text-base">
              Store Shipping & Fulfillment Rates
            </h3>
            <p className="text-xs text-stone-500">
              Deterministic customer checkout pricing evaluated during order calculation
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE]/60 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3">Shipping Tier Rule</th>
                <th className="px-4 py-3">Cart Subtotal Condition</th>
                <th className="px-4 py-3 font-mono">Customer Delivery Fee</th>
                <th className="px-4 py-3">Standard Delivery SLA</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shippingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-stone-900">
                    {rule.name}
                  </td>
                  <td className="px-4 py-3.5 text-stone-600 font-mono">
                    {rule.maxOrderAmount
                      ? `₹${rule.minOrderAmount} - ₹${rule.maxOrderAmount}`
                      : `₹${rule.minOrderAmount}+`}
                  </td>
                  <td className="px-4 py-3.5 font-bold font-outfit text-stone-900 text-sm">
                    {rule.isFree ? (
                      <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                    ) : (
                      `₹${rule.rate}`
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-stone-600">
                    {rule.estimatedDays}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Integrations Grid */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-6 space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="font-outfit font-bold text-stone-900 text-base">
            Courier Logistics Partners
          </h3>
          <p className="text-xs text-stone-500">
            Automated API generation of manifest labels and pickup schedules
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {couriers.map((courier) => (
            <div
              key={courier.id}
              className="p-4 rounded-2xl border border-stone-200 bg-[#FAF5EE]/40 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#C85A32] uppercase">
                    {courier.code}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      courier.apiConnected ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                    title={courier.apiConnected ? 'API Connected' : 'Inactive'}
                  />
                </div>
                <div className="font-bold text-stone-900 text-sm">{courier.name}</div>
                <div className="text-[11px] text-stone-500 mt-1">
                  {courier.serviceablePincodesCount.toLocaleString()} serviceable PINs
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <button
                  onClick={() => handleToggleCourier(courier.id, courier.isActive)}
                  className={`text-[11px] font-semibold transition-colors ${
                    courier.isActive ? 'text-emerald-700 hover:underline' : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  {courier.isActive ? 'Enabled' : 'Disabled'}
                </button>
                <span className="text-[10px] text-stone-400 font-mono">v2.4 API</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
