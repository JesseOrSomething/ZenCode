# 🤖 AI Chat Application

A modern, full-stack AI chat application with subscription-based payments, built with Node.js, Express, and Stripe integration.

## ✨ Features

- **AI Chat Interface** - Powered by OpenAI GPT-5-mini
- **User Authentication** - Secure login/signup with JWT
- **Subscription Plans** - Free (3 questions/day) and Pro ($17.49/month)
- **Payment Processing** - Stripe integration for secure payments
- **Image Analysis** - Upload and analyze images with AI
- **Conversation History** - Persistent chat memory
- **Responsive Design** - Beautiful glassmorphism UI

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Authentication**: JWT, bcrypt
- **Payments**: Stripe API
- **AI**: OpenAI GPT-5-mini
- **Database**: JSON file-based (easily upgradeable to PostgreSQL)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-app.git
   cd ai-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PORT=3000
FRONTEND_URL=http://localhost:3000
```

## 🚀 Deployment

### Railway (Recommended)
1. Push to GitHub
2. Connect to [Railway](https://railway.app)
3. Add environment variables
4. Deploy!

### DigitalOcean
1. Create Ubuntu droplet
2. Install Node.js and PM2
3. Clone repository
4. Configure Nginx reverse proxy
5. Set up SSL certificate

## 📱 Usage

1. **Visit the application** at `http://localhost:3000`
2. **Sign up** for a new account
3. **Choose a plan** (Free or Pro)
4. **Start chatting** with the AI!

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT authentication** for secure sessions
- **Rate limiting** for unauthenticated users
- **Input validation** and sanitization
- **HTTPS support** in production

## 💳 Payment Integration

- **Stripe Checkout** for secure payments
- **Subscription management** with instant cancellation
- **Webhook handling** for payment events
- **Automatic plan upgrades/downgrades**

## 🎨 UI/UX Features

- **Glassmorphism design** with beautiful gradients
- **Responsive layout** for all devices
- **Smooth animations** and transitions
- **Dark theme** with customizable colors
- **Accessibility features** for better usability

## 📊 API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/chat` - Chat with AI
- `GET /api/subscription` - Get subscription status
- `POST /api/subscription` - Update subscription
- `POST /api/create-checkout-session` - Create payment session
- `POST /api/cancel-subscription` - Cancel subscription

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the server logs
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check API key validity

## 🎯 Roadmap

- [ ] PostgreSQL database integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice chat integration
- [ ] Mobile app development

---

**Built with ❤️ for the AI community**