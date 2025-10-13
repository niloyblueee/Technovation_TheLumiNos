import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiBookOpen, FiHash } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import './AuthForms.css';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        national_id: '',
        sex: '',
        address: '',
        phone_number: '',
        location_coordinates: '',
        department: '',
        region: '',
        role: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const departments = [
        'Fire Department',
        'Health Department',
        'Police Department',
        'Public Works',
        'Environmental Services',
        'Transportation',
        'Housing & Urban Development',
        'Emergency Management',
        'Water & Sanitation',
        'Waste Management',
        'Parks & Recreation',
        'City Planning',
        'Social Services',
        'Education',
        'Finance',
        'Legal Affairs',
        'Information Technology',
        'Human Resources',
        'Other'
    ];

    const roleIdLabel = (role) => {
        if (role === 'admin') return 'Admin National ID';
        if (role === 'govt_authority') return 'Govt Authority National ID';
        if (role === 'police') return 'Police Department ID';
        if (role === 'health') return 'Health Department ID';
        if (role === 'fire') return 'Fire Service ID';
        if (role === 'water') return 'Water Management ID';
        if (role === 'electricity') return 'Electricity Department ID';
        return 'Citizen National ID';
    };

    const roles = [
        { value: 'citizen', label: 'Citizen' },
        { value: 'govt_authority', label: 'Government Authority' },
        { value: 'police', label: 'Police Department' },
        { value: 'health', label: 'Health Department' },
        { value: 'fire', label: 'Fire Service' },
        { value: 'water', label: 'Water Management' },
        { value: 'electricity', label: 'Electricity Department' }
    ];

    const roleRedirects = {
        admin: '/admin',
        govt_authority: '/govt-dashboard',
        citizen: '/citizen',
        police: '/police',
        health: '/health',
        fire: '/fire',
        water: '/water',
        electricity: '/electricity'
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            return 'Passwords do not match';
        }
        if (formData.password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!formData.national_id) {
            return 'National ID is required';
        }
        if (!formData.sex) {
            return 'Sex is required';
        }
        if (formData.role === 'citizen') {
            if (!formData.address) return 'Address is required';
        }
        if (!formData.phone_number) return 'Phone number is required';
        if (formData.role === 'govt_authority') {
            if (!formData.department) return 'Department is required';
            if (!formData.region) return 'Region is required';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

        setLoading(true);
        const result = await register(formData);
        if (result.success) {
            const role = result.user?.role;
            navigate(roleRedirects[role] || '/citizen');
        }
        setLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const result = await googleLogin(credentialResponse.credential);
            if (result.success) {
                const role = result.user?.role;
                navigate(roleRedirects[role] || '/citizen');
            }
        } catch (error) {
            toast.error('Google Sign-In failed');
        }
        setLoading(false);
    };

    const handleGoogleError = () => {
        toast.error('Google Sign-In failed');
        setLoading(false);
    };

    return (
        <motion.form
            className="auth-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Name Fields */}
            <div className="form-row">
                <div className="form-group-signup">
                    <div className="input-wrapper">
                        <FiUser className="input-icon" />
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                </div>
                <div className="form-group-signup">
                    <div className="input-wrapper">
                        <FiUser className="input-icon" />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>
                </div>
            </div>

            {/* Email Field */}
            <div className="form-group-signup">
                <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
            </div>

            {/* Role Selection */}
            <div className="form-group-signup">
                <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-input"
                        required
                        aria-label="Select user role"
                    >
                        <option value="" disabled hidden>Select Role</option>
                        <optgroup label="User Type">
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* National ID field (shown when a valid role is chosen) */}
            {formData.role && (
                <div className="form-group-signup">
                    <div className="input-wrapper">
                        <FiHash className="input-icon" />
                        <input
                            type="text"
                            name="national_id"
                            value={formData.national_id}
                            onChange={handleChange}
                            placeholder={`Enter your ${roleIdLabel(formData.role || 'citizen')}`}
                            required
                            className="form-input"
                        />
                    </div>
                </div>
            )}
            {/* Sex field (dropdown) */}
            {formData.role && (
                <div className="form-group-signup">
                    <div className="input-wrapper">
                        <FiUser className="input-icon" />
                        <select
                            name="sex"
                            value={formData.sex}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="" disabled hidden>Select Sex</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Phone number field (common for all roles) */}
            {formData.role && (
                <div className="form-group-signup">
                    <div className="input-wrapper">
                        <FiUser className="input-icon" />
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="Phone Number"
                            required
                            className="form-input"
                        />
                    </div>
                </div>
            )}
            {/* Citizen-specific fields */}
            {formData.role === 'citizen' && (
                <>
                    <div className="form-group-signup">
                        <div className="input-wrapper">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Address"
                                required
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div className="form-group-signup">
                        <div className="input-wrapper">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                name="location_coordinates"
                                value={formData.location_coordinates}
                                onChange={handleChange}
                                placeholder="Location Coordinates (optional)"
                                className="form-input"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Government Authority-specific fields */}
            {formData.role === 'govt_authority' && (
                <>
                    <div className="form-group-signup">
                        <div className="input-wrapper">
                            <FiBookOpen className="input-icon" />
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="">Select Government Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group-signup">
                        <div className="input-wrapper">
                            <FiUser className="input-icon" />
                            <select
                                name="region"
                                value={formData.region}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="">Select Region</option>
                                <option value="dhaka_north">Dhaka North</option>
                                <option value="dhaka_south">Dhaka South</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            {/* Password Fields */}
            <div className="form-group-signup">
                <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>
            </div>

            <div className="form-group-signup">
                <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                type="submit"
                className="submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>

            {/* Divider */}
            <div className="divider">
                <span>or</span>
            </div>
            <div className="divider2" />

            {/* Google Sign-In */}
            <div className="google-btn-container">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    locale="en"
                    disabled={loading}
                />
            </div>
        </motion.form>
    );
};

export default RegisterForm;
