import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Common/Header";
import HomeImage from ".././assets/Home.png";
import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Shield,
  Headphones,
  Play,
  Phone,
  Mail,
  ArrowRight,
  Leaf,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  TrendingUp,
} from "lucide-react";


const tradeVlogs = [
  {
    title: "Market Momentum Update",
    description:
      "Agri commodity prices showed a steady upward trend today driven by strong export demand and reduced supply in key regions. Major trading hubs reported increased activity as buyers secured positions ahead of the upcoming harvest season. Analysts predict continued strength in the market as global demand remains robust, particularly from Asian and Middle Eastern importers seeking quality Indian produce. Weather patterns across key growing regions continue to support favorable crop conditions, though concerns about input costs persist among farmer communities.",
    author: "Trade Desk",
    time: "2 hours ago",
  },
  {
    title: "Soybean Trade Insights",
    description:
      "Soybean contracts remained volatile as weather uncertainty in South America continues to impact global supply forecasts. The ongoing La Niña conditions have raised concerns about potential yield reductions in Brazil and Argentina, the world's largest soybean exporters. Indian processors are actively sourcing domestic supplies as import costs surge. Local crushing margins improved marginally, providing relief to oil mills. Farmer selling has been cautious, with many holding stocks in anticipation of better prices. Industry experts recommend close monitoring of international price movements and rainfall patterns in producing regions over the next few weeks.",
    author: "Commodities Team",
    time: "5 hours ago",
  },
  {
    title: "Wheat Demand Outlook",
    description:
      "Wheat demand from domestic millers increased significantly, keeping prices stable despite global market fluctuations and geopolitical tensions affecting Black Sea exports. Government procurement operations continue smoothly in major producing states, providing price support to farmers. Quality parameters remain a key focus, with premium grades commanding better realizations. Export inquiries from neighboring countries have picked up, though regulatory approvals remain pending. Storage infrastructure across mandis is being optimized to handle the current season's bumper arrivals. Market participants suggest that prices may see upward pressure if export restrictions are eased in the coming policy review.",
    author: "Market Analyst",
    time: "1 day ago",
  },
];

const testimonials = [
  {
    initials: "RK",
    name: "Ramesh Kumar",
    role: "Farmer, Karnataka",
    description: "Samunnati has transformed my farming business. Through their market linkage program, I now get fair prices for my produce and timely payments. The advisory support helped me improve my crop yield by 30%. I'm no longer dependent on middlemen.",
    bgColor: "bg-green-100",
    textColor: "text-green-700"
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    role: "CEO, Green Valley FPO, Maharashtra",
    description: "Working with Samunnati has been a game-changer for our FPO. Their financial solutions and market access have enabled us to scale operations and serve over 500 farmer members. The collateral-free loans came at the right time when we needed working capital the most.",
    bgColor: "bg-lime-100",
    textColor: "text-lime-700"
  },
  {
    initials: "AM",
    name: "Arun Mehta",
    role: "Director, AgriTech Solutions, Gujarat",
    description: "Samunnati's deep understanding of the agricultural value chain is unmatched. Their co-lending partnerships helped us expand our procurement network across three states. The seamless trade finance solutions ensure our supply chain runs smoothly without liquidity gaps.",
    bgColor: "bg-green-100",
    textColor: "text-green-700"
  },
  {
    initials: "SK",
    name: "Suresh Kamath",
    role: "BC Partner, Tamil Nadu",
    description: "As a BC partner, Samunnati has empowered me to serve my rural community better. The training and technology support they provide makes it easy to onboard farmers and process applications. I've helped over 200 farmers access credit in just six months.",
    bgColor: "bg-lime-100",
    textColor: "text-lime-700"
  },
  {
    initials: "VR",
    name: "Vijay Reddy",
    role: "Commodity Trader, Telangana",
    description: "TradeNext platform has revolutionized how I do business. Real-time market updates, transparent pricing, and quick financing approvals have increased my trading volume by 40%. The integrated warehouse receipt system gives my buyers complete confidence.",
    bgColor: "bg-green-100",
    textColor: "text-green-700"
  },
  {
    initials: "NS",
    name: "Neha Singh",
    role: "Progressive Farmer, Uttar Pradesh",
    description: "I'm a young farmer trying to modernize our family farm. Samunnati's advisory services and access to quality inputs at competitive prices have helped me adopt sustainable farming practices. The mobile app makes everything so convenient - from loan applications to market prices.",
    bgColor: "bg-lime-100",
    textColor: "text-lime-700"
  }
];

const Home = () => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % tradeVlogs.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const speed = 0.5;
    let animationFrameId;

    const step = () => {
      scrollAmount += speed;
      if (scrollAmount >= scrollContainer.scrollWidth / 2) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section
        className="py-16 lg:py-24 bg-cover bg-center bg-no-repeat min-h-[600px]"
        style={{ backgroundImage: `url(${HomeImage})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">

            </div>
          </div>
        </div>
      </section>

      {/* Transforming section */}
      <section className="w-full bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-lime-100 text-lime-700 text-sm font-medium px-4 py-1 rounded-full mb-4">
                Our Achievement
              </span>

              <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-snug">
                Making Market work for <br />the small farmholders
              </h3>
            </div>

            <div className="flex gap-10 items-center justify-start lg:justify-end">
              <div>
                <h3 className="text-4xl font-bold text-black">56k</h3>
                <p className=" text-sm  text-black mt-1">
                  Farmers partnered with Samunnati
                </p>
              </div>

              <div className="h-12 w-px bg-gray-300" />

              <div>
                <h3 className="text-4xl font-bold text-black">70+</h3>
                <p className="text-black text-sm mt-1">
                  Agribusiness Companies <br />
                  that have Collaborated
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 space-y-24">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-xl text-primary font-bold">
                Samunnati Impact
              </h1>
              <h3 className="text-2xl md:text-3xl font-bold text-black mt-2 mb-4">
                Strengthening India's Agricultural Value Chain
              </h3>
              <p className="text-black">
                Discover how Samunnati connects farmers, farmer producer organizations, and agri-enterprises
                through innovative financial and non-financial solutions. By enabling access to markets,
                capital, and technology, Samunnati drives inclusive and sustainable growth while strengthening
                resilience across the agricultural ecosystem.
              </p>
            </div>
            <img
              src="https://samunnati.com/wp-content/uploads/2025/10/news-AE-thumbnail.jpg"
              alt="Feature 1"
              className="rounded-2xl w-full h-64 md:h-80 object-cover"
            />
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <img
              src="https://eu-images.contentstack.com/v3/assets/blt31d6b0704ba96e9d/blt3bc557f268c61149/68387f71670196d71a8ab852/Agtech_farming_IoT_GettyImages-1469639791.jpg?width=1280&auto=webp&quality=80&disable=upscale"
              alt="Feature 2"
              className="rounded-2xl w-full h-64 md:h-80 object-cover order-2 md:order-1"
            />
            <div className="order-1 md:order-2 ">
              <span className="text-xl text-primary font-bold">
                Integrated Solutions
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-black mt-2 mb-4">
                Empowering Farmers Beyond Finance
              </h2>
              <p className="text-black">
                Samunnati goes beyond traditional financing by offering a comprehensive suite of
                non-financial services, including market linkages, advisory support, and technology-driven
                insights. These integrated solutions enable farmers and agri-enterprises to make informed
                decisions, improve productivity, and unlock long-term value across the supply chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Programs Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-black mb-12">
            Powering Progress through Partner Programmes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Samunnati Associate */}
            <Card className="overflow-hidden">
              <img
                src="https://img-cdn.publive.online/fit-in/640x430/filters:format(webp)/entrackr/media/media_files/2026/01/19/samunnati-2026-01-19-11-44-29.png"
                alt="Samunnati Associate"
                className="h-48 w-full object-cover"
              />
              <div className="p-6 text-center bg-white">
                <h3 className="font-semibold text-lg text-black mb-2">Samunnati Associate</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you are connected to agribusiness & startups you can partner with Samunnati to
                  help you tap into Indian agriculture's trillion-dollar potential.
                </p>
                <Link to="/item-fulfillments">
                  <Button variant="outline" className="border-primary text-white hover:bg-primary hover:text-primary-foreground">
                    Partner With Us
                  </Button>
                </Link>
              </div>
            </Card>

            {/* BC Partner */}
            <Card className="overflow-hidden">
              <img
                src="https://davies-group.com/wp-content/uploads/2021/03/Website-other.png"
                alt="BC Partner"
                className="h-48 w-full object-cover"
              />
              <div className="p-6 text-center bg-white">
                <h3 className="font-semibold text-lg text-black mb-2">BC Partner</h3>
                <p className="text-sm text-gray-600 mb-4 bg-white">
                  If you are ready to take Samunnati's solutions to community at large in your
                  network and willing to tap into Indian agriculture's trillion-dollar potential.
                </p>
                <Link to="/item-fulfillments/create">
                  <Button variant="outline" className="border-primary text-white hover:bg-primary hover:text-primary-foreground">
                    Partner With Us
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Co-Lending */}
            <Card className="overflow-hidden">
              <img
                src="https://samunnati.com/wp-content/uploads/2025/10/01_SBI-e1657280519844.jpg"
                alt="Co-Lending"
                className="h-48 w-full object-cover"
              />
              <div className="p-6 text-center bg-white">
                <h3 className="font-semibold text-lg mb-2 text-black">Co-Lending</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you are looking for opportunities to build a sustainable agri ecosystem and foster
                  growth in the agri finance value chain through strategic partnerships.
                </p>
                <Link to="/item-fulfillments">
                  <Button variant="outline" className="border-primary text-white hover:bg-primary hover:text-primary-foreground">
                    Partner With Us
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-lime-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-lime-100 text-lime-700 text-sm font-medium px-4 py-1 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
              Voices from Our Community
            </h2>
            <p className="text-black max-w-2xl mx-auto">
              Hear from farmers, agribusinesses, and partners who have experienced the Samunnati difference
            </p>
          </div>

          {/* Horizontal auto-scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar"
            style={{ scrollBehavior: 'auto' }}
          >
            {/* Duplicate testimonials for seamless loop */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={index} className="min-w-[350px] flex-shrink-0">
                <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full ${testimonial.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={`${testimonial.textColor} font-bold text-lg`}>
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-4">
                    {testimonial.description}
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-green-700 mb-2">4.8/5</h3>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">56k+</h3>
              <p className="text-sm text-gray-600">Happy Farmers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-700 mb-2">98%</h3>
              <p className="text-sm text-gray-600">Satisfaction Rate</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-green-700 mb-2">₹5000Cr+</h3>
              <p className="text-sm text-gray-600">Credit Disbursed</p>
            </div>
          </div>
        </div>

      
      </section>

      {/* Trade Feed Section */}
      <section className="py-16 bg-white mb-30">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-black mb-10">
            Trade Feed
          </h2>

          <div className="relative overflow-hidden">
            {/* Slides */}
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {tradeVlogs.map((vlog, index) => (
                <div
                  key={index}
                  className="min-w-full px-4"
                >
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                      {vlog.title}
                    </h3>
                    <p className="text-gray-800 text-sm mb-4">
                      {vlog.description}
                    </p>
                    <div className="flex justify-between text-xs text-primary">
                      <span>{vlog.author}</span>
                      <span>{vlog.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {tradeVlogs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all ${
                    current === index
                      ? "bg-primary w-6"
                      : "bg-muted w-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          {/* Main Grid */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold">Samunnati</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering agricultural communities through innovative financial and trade solutions, creating sustainable prosperity across India's farming ecosystem.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-gray-400">
                  <Mail className="h-5 w-5 mt-1 flex-shrink-0" />
                  <span className="text-sm">Baid Hitech Park, 129-B, 8th Floor, ECR, Thiruvanmiyur, Chennai – 600041</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <span>+91 97908 97000</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <span>info@samunnati.com</span>
                </div>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {["About Us", "Our Team", "Careers", "Help Center", "Contact"].map((item) => (
                  <li key={item}>
                    <Link to="#" className="text-gray-400 hover:text-green-500 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                {["Blog", "Case Studies", "FAQs", "Partner Programs", "Impact Stories"].map((item) => (
                  <li key={item}>
                    <Link to="#" className="text-gray-400 hover:text-green-500 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Media */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, label: "Facebook" },
                    { icon: Twitter, label: "Twitter" },
                    { icon: Linkedin, label: "LinkedIn" },
                    { icon: Instagram, label: "Instagram" },
                    { icon: Youtube, label: "YouTube" },
                  ].map(({ icon: Icon, label }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="p-3 bg-gray-800 rounded-full hover:bg-green-600 transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-400 mb-2">Subscribe to our newsletter</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-green-500"
                  />
                  <Button className="bg-green-600 hover:bg-green-700">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>© 2023 Samunnati Agro Solutions Pvt Ltd. All Rights Reserved</p>
              <div className="flex gap-6">
                <Link to="#" className="hover:text-green-500 transition-colors">
                  Terms & Conditions
                </Link>
                <span>|</span>
                <Link to="#" className="hover:text-green-500 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;