export default function VendorTable({ vendors, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
              <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
              <th className="py-2.5 px-3 font-semibold">Brand</th>
              <th className="py-2.5 px-3 font-semibold">Device Type</th>
              <th className="py-2.5 px-3 font-semibold">Assigned Nodes</th>
              <th className="py-2.5 px-3 font-semibold">Description</th>
              <th className="py-2.5 px-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">No vendors available.</td>
              </tr>
            ) : (
              vendors.map((vendor) => {
                return (
                  <tr key={vendor.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{vendor.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{vendor.brand || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        {vendor.deviceType || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{vendor.assignedNodeCount ?? 0}</td>
                    <td className="py-2.5 px-3 text-slate-700">{vendor.description || '-'}</td>
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
                          onClick={() => onDelete(vendor)}
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
