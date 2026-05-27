import { getCustomerStatusBadgeClass } from '../../utils/correlation';

export default function CustomerImpactTable({ customers }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Customer Impact</h2>
        <p className="text-xs text-slate-500 mt-0.5">Overall service health derived from associated node states</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
              <th className="py-2.5 px-3 font-semibold">Customer Name</th>
              <th className="py-2.5 px-3 font-semibold">Number of Nodes</th>
              <th className="py-2.5 px-3 font-semibold">Nodes Down</th>
              <th className="py-2.5 px-3 font-semibold">Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">No customer impact data found.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-800">{customer.name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{customer.nodeCount}</td>
                  <td className="py-2.5 px-3 text-slate-700">{customer.nodesDown}</td>
                  <td className="py-2.5 px-3">
                    <span className={`${getCustomerStatusBadgeClass(customer.overallStatus)} text-xs font-semibold px-2 py-0.5 rounded`}>
                      {customer.overallStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
