import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Mail, Lock, AlertCircle, Loader2, Shield, Users, TrendingUp, Award, CheckCircle, ArrowRight, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('InternsLand');
  
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const cachedName = localStorage.getItem('companyName');
        if (cachedName) setCompanyName(cachedName);

        const { data } = await axios.get('http://localhost:5001/api/settings/company-info');
        
        if (data.success && data.companyName) {
          setCompanyName(data.companyName);
          localStorage.setItem('companyName', data.companyName);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCompanyInfo();
  }, []);

  const floatingCircles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      size: Math.random() * 400 + 100,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 5
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and multi-factor authentication"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Seamless communication across departments"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Analytics & Insights",
      description: "Real-time HR metrics and performance tracking"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Compliance Ready",
      description: "Built-in compliance with labor laws and regulations"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "50+", label: "Countries" },
    { value: "24/7", label: "Support" }
  ];

  return (

    <div className="h-screen w-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 dark:from-gray-950 dark:via-slate-950 dark:to-zinc-950 transition-all duration-500">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-15 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          {floatingCircles.map((circle, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/25 dark:bg-blue-400/40 border border-white/30 dark:border-blue-300/20"
              style={{
                width: circle.size + 'px',
                height: circle.size + 'px',
                top: circle.top + '%',
                left: circle.left + '%',
                animation: `float ${circle.duration}s ease-in-out infinite`,
                animationDelay: `${circle.delay}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/15 rounded-full blur-3xl animate-pulse-slower"></div>
      </div>

      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 group cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
        ) : (
          <Moon className="h-5 w-5 text-white group-hover:rotate-180 transition-transform duration-500" />
        )}
      </button>


      {/* Content Wrapper */}
      <div className="flex h-full">
        
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 dark:bg-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/15 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 p-4 rounded-2xl shadow-xl">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{companyName}</h1>
                <p className="text-blue-50 dark:text-blue-300 text-sm font-medium">Enterprise HRMS Platform</p>
              </div>
            </div>


            {/* Hero Content */}
            <div className="space-y-6 mb-8">
              <div>
                <h2 className="text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
                  Transform Your<br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-blue-50 to-purple-50 dark:from-blue-200 dark:via-indigo-200 dark:to-purple-200">
                    Workforce Management
                  </span>
                </h2>
                <p className="text-blue-50 dark:text-gray-300 text-lg leading-relaxed max-w-md drop-shadow-md">
                  Streamline HR operations with our all-in-one platform designed for modern enterprises.
                </p>
              </div>


              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="relative bg-white/15 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-xl p-3 hover:bg-white/25 dark:hover:bg-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-500 cursor-pointer group overflow-hidden"
                    style={{
                      animation: `slideInUp 0.6s ease-out ${index * 0.1}s backwards`
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    {/* Icon with rotation and scale */}
                    <div className="text-white mb-2 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      {feature.icon}
                    </div>
                    
                    {/* Title with slide effect */}
                    <h3 className="text-white font-semibold text-sm mb-1 transform group-hover:translate-x-2 transition-all duration-300 drop-shadow">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-blue-50 dark:text-gray-300 text-xs leading-relaxed group-hover:text-white transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>


            {/* Stats Footer */}
          <div className="relative z-8 grid grid-cols-4 gap-6 pt-4 border-t border-white/30 dark:border-white/10">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-white mb-1 drop-shadow-lg">{stat.value}</div>
                <div className="text-blue-50 dark:text-gray-300 text-xs font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>


        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 relative overflow-hidden">
          
          <Card className="w-full max-w-[420px] relative z-10 shadow-2xl border border-white/30 dark:border-white/10 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl">
            <div className="p-6">
              
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {companyName}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Enterprise HRMS</p>
                </div>
              </div>


              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in to access your dashboard and manage your workforce
                </p>
              </div>


              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="animate-shake bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Email Address
                  </label>
                  <div className="relative group">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 pl-3.5 pr-3.5 text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all duration-300 bg-white dark:bg-slate-800"
                    />
                    <div className="absolute inset-0 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>


                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Password
                  </label>
                  <div className="relative group">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}

                      className="h-11 pl-3.5 pr-3.5 text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all duration-300 bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-20 cursor-pointer"
                    >
                      {showPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-linear-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>


                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm pt-1">
               
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group mt-2"
                >
                  <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 ">
                      Sign In
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                      Trusted by enterprises worldwide
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>ISO Certified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span>SOC 2 Type II</span>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2026 {companyName}. All rights reserved.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-slower {
          0%, 100% { 
            opacity: 0.15;
            transform: scale(1);
          }
          50% { 
            opacity: 0.25;
            transform: scale(1.03);
          }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;