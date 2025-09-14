import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Video, 
    Users, 
    Shield, 
    Star,
    ArrowRight,
    Play,
    Check,
    MessageSquare,
    Monitor,
    Clock
} from 'lucide-react';

const Landing = () => {
    const features = [
        {
            icon: Video,
            title: 'HD Video Quality',
            description: 'Crystal clear video calls with adaptive quality based on your connection',
            color: 'blue'
        },
        {
            icon: Users,
            title: 'Multiple Participants',
            description: 'Host meetings with unlimited participants and manage them easily',
            color: 'purple'
        },
        {
            icon: Monitor,
            title: 'Screen Sharing',
            description: 'Share your screen, presentations, and applications seamlessly',
            color: 'green'
        },
        {
            icon: MessageSquare,
            title: 'Real-time Chat',
            description: 'Send messages during meetings with emoji reactions and file sharing',
            color: 'orange'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'End-to-end encryption ensures your meetings stay private and secure',
            color: 'red'
        },
        {
            icon: Clock,
            title: 'Meeting Recording',
            description: 'Record important meetings and access them anytime, anywhere',
            color: 'indigo'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Chen',
            role: 'Product Manager',
            company: 'TechCorp',
            avatar: 'SC',
            content: 'The best video calling experience I\'ve had. Clean interface and reliable connection.',
            rating: 5
        },
        {
            name: 'Michael Rodriguez',
            role: 'CEO',
            company: 'StartupXYZ',
            avatar: 'MR',
            content: 'Perfect for our remote team meetings. The screen sharing feature is fantastic.',
            rating: 5
        },
        {
            name: 'Emily Johnson',
            role: 'Designer',
            company: 'Creative Studios',
            avatar: 'EJ',
            content: 'Love the modern design and smooth performance. Makes video calls enjoyable.',
            rating: 5
        }
    ];

    const plans = [
        {
            name: 'Basic',
            price: 'Free',
            description: 'Perfect for personal use',
            features: [
                'Up to 40 minutes per meeting',
                'Up to 100 participants',
                'Screen sharing',
                'Chat messaging',
                'Basic support'
            ],
            popular: false,
            buttonText: 'Get Started'
        },
        {
            name: 'Pro',
            price: '$9.99',
            period: '/month',
            description: 'Best for small teams',
            features: [
                'Unlimited meeting duration',
                'Up to 500 participants',
                'Meeting recording',
                'Advanced chat features',
                'Priority support',
                'Custom backgrounds'
            ],
            popular: true,
            buttonText: 'Start Free Trial'
        },
        {
            name: 'Enterprise',
            price: '$19.99',
            period: '/month',
            description: 'For large organizations',
            features: [
                'Everything in Pro',
                'Unlimited participants',
                'Advanced admin controls',
                'SSO integration',
                'Dedicated support',
                'Custom branding'
            ],
            popular: false,
            buttonText: 'Contact Sales'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Video className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-gray-900">VideoMeet</span>
                        </div>
                        
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
                            <Link 
                                to="/login" 
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link 
                                to="/signup" 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                                Video Meetings
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    Made Simple
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                                Connect with your team, family, and friends through high-quality video calls. 
                                Secure, reliable, and incredibly easy to use.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                        >
                            <Link 
                                to="/signup"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                            >
                                <span>Start Meeting Now</span>
                                <ArrowRight size={20} />
                            </Link>
                            <button className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200 flex items-center justify-center space-x-2">
                                <Play size={20} />
                                <span>Watch Demo</span>
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="relative max-w-4xl mx-auto"
                        >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-2 shadow-2xl">
                                <div className="bg-gray-900 rounded-xl overflow-hidden">
                                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Video size={64} className="mx-auto mb-4 opacity-50" />
                                            <p className="text-lg">Video Preview Coming Soon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need for perfect meetings
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Powerful features designed to make your video calls more productive and enjoyable
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-6`}>
                                    {React.createElement(feature.icon, { className: "text-white", size: 28 })}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '1M+', label: 'Users Worldwide' },
                            { number: '99.9%', label: 'Uptime' },
                            { number: '4.9/5', label: 'User Rating' },
                            { number: '24/7', label: 'Support' }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-white"
                            >
                                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                                <div className="text-blue-100">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Loved by teams worldwide
                        </h2>
                        <p className="text-xl text-gray-600">
                            See what our users have to say about their experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="text-yellow-400 fill-current" size={20} />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-6 italic">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Choose the plan that's right for you and your team
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                                    plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-gray-600 mb-6">{plan.description}</p>
                                    
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                        {plan.period && <span className="text-gray-600">{plan.period}</span>}
                                    </div>
                                    
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center">
                                                <Check className="text-green-500 mr-3" size={16} />
                                                <span className="text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <Link
                                        to="/signup"
                                        className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-200 block ${
                                            plan.popular
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    >
                                        {plan.buttonText}
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            Ready to get started?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8">
                            Join millions of users who trust VideoMeet for their important conversations
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                to="/signup"
                                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Start Free Today
                            </Link>
                            <Link 
                                to="/login"
                                className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Video className="text-white" size={20} />
                                </div>
                                <span className="text-xl font-bold">VideoMeet</span>
                            </div>
                            <p className="text-gray-400 mb-6">
                                The most reliable and secure video conferencing platform for teams and individuals worldwide.
                            </p>
                            <div className="flex space-x-4">
                                {/* Social icons would go here */}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 VideoMeet. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;