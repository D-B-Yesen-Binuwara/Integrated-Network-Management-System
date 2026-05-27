export default function VendorTable({ vendors, nodesByVendorId, onAdd, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Vendor Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage vendor coverage and node assignments</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Vendor
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
              <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
              <th className="py-2.5 px-3 font-semibold">Supported Node Types</th>
              <th className="py-2.5 px-3 font-semibold">Assigned Nodes</th>
              <th className="py-2.5 px-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">No vendors found.</td>
              </tr>
            ) : (
              vendors.map((vendor) => {
                const assignedCount = nodesByVendorId.get(String(vendor.id)) ?? 0;
                const supportedNodeTypes = Array.isArray(vendor.supportedNodeTypes) ? vendor.supportedNodeTypes : [];

                return (
                  <tr key={vendor.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{vendor.name}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {supportedNodeTypes.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : supportedNodeTypes.map((type) => (
                          <span key={`${vendor.id}-${type}`} className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{assignedCount}</td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onEdit(vendor)}
                          className="text-slate-700 hover:text-slate-900 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(vendor, assignedCount)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
