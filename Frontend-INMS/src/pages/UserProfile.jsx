import React, { useState, useEffect } from 'react';

const UserProfile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [passwordFields, setPasswordFields] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // Simulate an API call mapping to User.cs
        setTimeout(() => {
            setUserData({
                userId: '748392',
                username: 'janedoe99',
                fullName: 'Jane Doe',
                passwordHash: 'N0c0perat0r_pwd!', // Simulated real password
                roleId: 'ROLE_ENGINEER_2',
                role: 'Network Operations Engineer',
                stats: {
                    alarmsResolved: 342,
                    activeSimulations: 3,
                    criticalAlertsHandled: 89,
                    uptimeContributions: '99.98%'
                }
            });
            setLoading(false);
        }, 500);
    }, []);

    const handleEditClick = () => {
        setEditFormData({ ...userData });
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const handleChangePasswordClick = () => {
        setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setFormErrors({});
        setIsPasswordModalOpen(true);
    };

    const handleInputChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = () => {
        const errors = {};

        // Validate basic fields
        if (!editFormData.username?.trim()) errors.username = 'Username cannot be empty.';
        if (!editFormData.fullName?.trim()) errors.fullName = 'Full Name cannot be empty.';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setUserData(editFormData);
        setIsEditModalOpen(false);
    };

    const handleSavePassword = () => {
        const errors = {};

        if (!passwordFields.oldPassword) {
            errors.oldPassword = 'Old password cannot be empty.';
        } else if (passwordFields.oldPassword !== userData.passwordHash) {
            errors.oldPassword = 'Old password does not match your current password.';
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordFields.newPassword) {
            errors.newPassword = 'New password cannot be empty.';
        } else if (!passwordRegex.test(passwordFields.newPassword)) {
            errors.newPassword = 'Password must be at least 8 chars and include a letter, number, and special character.';
        }

        if (!passwordFields.confirmPassword) {
            errors.confirmPassword = 'Confirm password cannot be empty.';
        } else if (passwordFields.newPassword !== passwordFields.confirmPassword) {
            errors.confirmPassword = 'New password and confirm password do not match.';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setUserData(prev => ({ ...prev, passwordHash: passwordFields.newPassword }));
        setIsPasswordModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditFormData(null);
        setFormErrors({});
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setPasswordFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setFormErrors({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-800">

                {/* Centered User Details Section */}
                <div className="flex justify-center mt-6">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-3xl overflow-hidden h-fit">
                        <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-800 px-6 py-5 border-b border-emerald-400/40">
                            <h3 className="font-semibold text-base text-white tracking-wide">Profile Details</h3>
                        </div>

                        <div className="p-7 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{userData.fullName}</h2>
                                <p className="text-sm text-emerald-600 font-medium mt-1">{userData.role}</p>
                            </div>

                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500 w-1/3">Service Number</td>
                                        <td className="py-3 font-medium text-slate-800">{userData.userId}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500">Username</td>
                                        <td className="py-3 font-medium text-slate-800">{userData.username}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500">Full Name</td>
                                        <td className="py-3 font-medium text-slate-800">{userData.fullName}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 text-slate-500">Password</td>
                                        <td className="py-3 font-medium">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono bg-slate-50 text-slate-600 px-3 py-1.5 rounded-md border border-slate-200 tracking-wider">
                                                    {showPassword ? userData.passwordHash : '••••••••••••'}
                                                </span>
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none bg-slate-50 p-1.5 rounded-md border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50"
                                                    title={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleChangePasswordClick}
                                                    className="ml-2 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
                                                >
                                                    Change Password
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex flex-col sm:flex-row gap-4 pt-5 border-t border-slate-100">
                                <button 
                                    onClick={handleEditClick}
                                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 rounded-lg border border-slate-300 shadow-sm transition-all hover:shadow">
                                    Edit Profile
                                </button>
                                <button className="flex-1 bg-white hover:bg-red-50 text-red-600 text-sm font-semibold py-2.5 rounded-lg border border-red-200 shadow-sm transition-all hover:border-red-300">
                                    Delete Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-800 px-6 py-4 border-b border-emerald-400/40 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                            <h3 className="font-semibold text-white tracking-wide">Edit Profile</h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors focus:outline-none"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Service Number (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Number</label>
                                <input
                                    type="text"
                                    value={editFormData?.userId || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Service number cannot be changed</p>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                                <input
                                    type="text"
                                    value={editFormData?.username || ''}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                                {formErrors.username && <p className="text-sm text-red-500 mt-1.5">{formErrors.username}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData?.fullName || ''}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                                {formErrors.fullName && <p className="text-sm text-red-500 mt-1.5">{formErrors.fullName}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                                <input
                                    type="text"
                                    value={editFormData?.role || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Role cannot be changed</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 backdrop-blur-md">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-slate-800 px-6 py-4 border-b border-emerald-400/40 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                            <h3 className="font-semibold text-white tracking-wide">Change Password</h3>
                            <button
                                onClick={handleClosePasswordModal}
                                className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors focus:outline-none"
                                title="Close"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Old Password</label>
                                <input
                                    type="password"
                                    value={passwordFields.oldPassword}
                                    onChange={(e) => setPasswordFields(prev => ({ ...prev, oldPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                                {formErrors.oldPassword && <p className="text-sm text-red-500 mt-1.5">{formErrors.oldPassword}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={passwordFields.newPassword}
                                    onChange={(e) => setPasswordFields(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                                {formErrors.newPassword && <p className="text-sm text-red-500 mt-1.5">{formErrors.newPassword}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordFields.confirmPassword}
                                    onChange={(e) => setPasswordFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                                />
                                {formErrors.confirmPassword && <p className="text-sm text-red-500 mt-1.5">{formErrors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 backdrop-blur-md">
                            <button
                                onClick={handleClosePasswordModal}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePassword}
                                className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserProfile;
