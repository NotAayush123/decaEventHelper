"use client";

import React, { useState } from 'react';
import { ChevronRight, Award, Users, Target, BookOpen, Search, CheckCircle, TrendingUp, Briefcase, Sparkles } from 'lucide-react';

const DECAEventRecommender = () => {
  // State for ordered skills and other preferences
  const [orderedSkills, setOrderedSkills] = useState([]);
  const [otherFormData, setOtherFormData] = useState({
    prepStyle: '',
    experience: [],
    popularity: '',
    teamPreference: '',
    includeVirtual: false,
  });
  
  const [visibleCount, setVisibleCount] = useState(5);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  // Constants and mappings
  const TEAM_TAG = "Team";
  const experienceTagMap = {
    'Marketing Plans': 'Marketing',
    'Financial Analysis': 'Finance',
    'Public Speaking': 'Presentation',
    'Business Plans': 'Entrepreneurship',
    'Data Analysis': 'Research',
    'Project Management': 'Business Management',
    'Customer Service': 'Hospitality'
  };

  // DECA color scheme
  const decaColors = {
    primary: '#055ee4',    // DECA Blue
    secondary: '#668a00',  // DECA Green
    accent: '#d61919',     // DECA Red
    gradient: 'linear-gradient(45deg, #055ee4, #668a00, #d61919)',
    lightGradient: 'linear-gradient(45deg, #4287ff, #85b300, #ff4040)'
  };

  // New scoring algorithm with skill prioritization
  const scoreEvents = (events, userSkills, userInput) => {
    // First filter out virtual events if not selected
    const filteredEvents = userInput.includeVirtual 
      ? events 
      : events.filter((event) => !event.name.startsWith('V') && event.category !== "Virtual");
    
    return filteredEvents.map((event) => {
      let score = 0;
      const totalTags = event.tags.length;
      const matchedTags = new Set(); // Track already matched tags
      
      // Calculate base score from skill matches with priority weighting
      userSkills.forEach((skill, index) => {
        const priorityWeight = 1.5 - (index * 0.15); // 1.5, 1.35, 1.2, etc.
        
        if (event.tags.includes(skill)) {
          score += priorityWeight;
          matchedTags.add(skill);
        }
      });

      // Match experience with mapping
      userInput.experience.forEach((exp) => {
        const tag = experienceTagMap[exp] || exp;
        // Only count if not already matched by skills
        if (event.tags.includes(tag) && !matchedTags.has(tag)) {
          score += 0.8; // Slightly lower weight than primary skills
          matchedTags.add(tag);
        }
      });

      // Match prep style (only if not already matched)
      if (userInput.prepStyle && 
          event.tags.includes(userInput.prepStyle) && 
          !matchedTags.has(userInput.prepStyle)) {
        score += 0.7;
      }

      // Popularity scoring
      if (userInput.popularity === "Less popular events") {
        if (event.popularity === "Low") score += 1.5;
        else if (event.popularity === "High") score -= 0.8;
      }
      
      // Team preference
      if (userInput.teamPreference === "Team" && event.tags.includes(TEAM_TAG)) score += 1;
      if (userInput.teamPreference === "Solo" && !event.tags.includes(TEAM_TAG)) score += 1;

      // Calculate match percentage (properly capped)
      const maxPossibleScore = (userSkills.length * 1.5) + 3; // Max skill score + other bonuses
      const match = Math.min(100, Math.max(0, Math.round((score / maxPossibleScore) * 100)));
      
      return { ...event, match, rawScore: score };
    }).sort((a, b) => b.rawScore - a.rawScore);
  };

  // Skill options for DECA
  const skillOptions = [
    'Marketing', 'Finance', 'Hospitality', 'Business Management', 
    'Entrepreneurship', 'Sales', 'Presentation', 'Research', 'Leadership'
  ];

  const prepStyleOptions = [
    'Roleplay Performance',
    'Written Event/Report', 
    'Exam Only',
    'Combined Event'
  ];

  const experienceOptions = [
    'Marketing Plans', 'Financial Analysis', 'Public Speaking', 'Business Plans',
    'Data Analysis', 'Project Management', 'Customer Service', 'None'
  ];

  const popularityOptions = [
    'High Competition',
    'Moderate Competition',
    'Lower Competition',
    "I don't care"
  ];

  // Drag-and-drop component for ordering skills
  const SkillOrdering = ({ skills, onOrderChange }) => {
    const addSkill = (skill) => {
      if (!skills.includes(skill) && skills.length < 5) {
        onOrderChange([...skills, skill]);
      }
    };

    const removeSkill = (skill) => {
      onOrderChange(skills.filter(s => s !== skill));
    };

    return (
      <div className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Select your skills in order of importance (most important first)
          </p>
          
          <div className="space-y-2">
            {skills.map((skill, index) => (
              <div 
                key={skill} 
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200"
              >
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: decaColors.gradient }}
                >
                  {index + 1}
                </span>
                <span className="flex-1 font-medium text-gray-900 ml-1">
                  {skill}
                </span>
                <button 
                  onClick={() => removeSkill(skill)}
                  className="hover:underline text-sm font-medium transition-colors hover:cursor-pointer"
                  style={{ color: decaColors.accent }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {skills.length < 5 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Add more skills (up to 5):
            </label>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {skillOptions
                .filter(skill => !skills.includes(skill))
                .map(skill => (
                  <button
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="p-2 rounded-lg text-black font-semibold border border-gray-300 transition-colors hover:bg-gray-100 hover:cursor-pointer text-center"
                  >
                    {skill}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleVirtualChange = (e) => {
    setOtherFormData(prev => ({
      ...prev,
      includeVirtual: e.target.checked
    }));
  };

  const handleExperienceChange = (exp) => {
    setOtherFormData(prev => ({
      ...prev,
      experience: prev.experience.includes(exp)
        ? prev.experience.filter(e => e !== exp)
        : [...prev.experience, exp]
    }));
  };

  const handleSubmit = async () => {
    if (orderedSkills.length === 0) {
      alert("Please select at least one skill to get recommendations");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const results = scoreEvents(allEvents, orderedSkills, otherFormData);
    setRecommendations(results);
    setVisibleCount(5);
    setIsSubmitting(false);
    setShowRecommendations(true);
  };

  const clearForm = () => {
    setOrderedSkills([]);
    setOtherFormData({
      prepStyle: '',
      experience: [],
      popularity: '',
      teamPreference: '',
      includeVirtual: false,
    });
  };

  // DECA Events Database
const allEvents = [
  // Principles of Business Administration Events
  { name: "Principles of Business Management and Administration", category: "Principles", tags: ["Business Management", "Exam Only"], popularity: "High", description: "Comprehensive exam on business management fundamentals and administrative procedures." },
  { name: "Principles of Finance", category: "Principles", tags: ["Finance", "Exam Only"], popularity: "High", description: "Test knowledge of financial principles, banking, and investment concepts." },
  { name: "Principles of Hospitality and Tourism", category: "Principles", tags: ["Hospitality", "Exam Only"], popularity: "Moderate", description: "Exam covering hospitality, tourism, and customer service industry fundamentals." },
  { name: "Principles of Marketing", category: "Principles", tags: ["Marketing", "Exam Only"], popularity: "High", description: "Test marketing principles, consumer behavior, and promotional strategies." },

  // Business Management Team Decision Making Events
  { name: "Business Law and Ethics Team Decision Making", category: "Business Management", tags: ["Business Management", "Presentation", "Roleplay Performance", "Team"], popularity: "Moderate", description: "Analyze legal and ethical business scenarios through team roleplay and presentation." },
  { name: "Business Finance Team Decision Making", category: "Business Management", tags: ["Finance", "Presentation", "Roleplay Performance", "Team"], popularity: "High", description: "Financial analysis and decision-making through team roleplay scenarios." },
  { name: "Business Services Team Decision Making", category: "Business Management", tags: ["Business Management", "Presentation", "Roleplay Performance", "Team"], popularity: "Moderate", description: "Business services operations and management decisions through team roleplay." },
  { name: "Buying and Merchandising Team Decision Making", category: "Business Management", tags: ["Business Management", "Sales", "Roleplay Performance", "Team"], popularity: "Moderate", description: "Retail buying and merchandising decisions through interactive team roleplay." },
  { name: "Hotel and Lodging Management Team Decision Making", category: "Business Management", tags: ["Hospitality", "Presentation", "Roleplay Performance", "Team"], popularity: "High", description: "Hotel operations and management decisions through team roleplay scenarios." },
  { name: "Marketing Management Team Decision Making", category: "Business Management", tags: ["Marketing", "Presentation", "Roleplay Performance", "Team"], popularity: "High", description: "Strategic marketing decisions and campaign development through team roleplay." },
  { name: "Sports and Entertainment Marketing Team Decision Making", category: "Business Management", tags: ["Marketing", "Presentation", "Roleplay Performance", "Team"], popularity: "High", description: "Sports and entertainment industry marketing solutions through team roleplay." },
  { name: "Travel and Tourism Team Decision Making", category: "Business Management", tags: ["Hospitality", "Presentation", "Roleplay Performance", "Team"], popularity: "Moderate", description: "Tourism industry solutions and management through collaborative team roleplay." },

  // Personal Financial Literacy
  { name: "Personal Financial Literacy", category: "Finance", tags: ["Finance", "Exam Only"], popularity: "High", description: "Test personal finance knowledge including budgeting, investing, and financial planning." },

  // Individual Series Events
  { name: "Accounting Applications Series", category: "Finance", tags: ["Finance", "Presentation", "Combined Event"], popularity: "Moderate", description: "Apply accounting principles through exam and individual roleplay performance." },
  { name: "Apparel and Accessories Marketing Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "Moderate", description: "Fashion marketing strategies through exam and individual roleplay performance." },
  { name: "Automotive Services Marketing Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "Lower", description: "Automotive industry marketing through exam and individual roleplay performance." },
  { name: "Business Services Marketing Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "Moderate", description: "Business services marketing strategies through exam and individual roleplay." },
  { name: "Food Marketing Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "Moderate", description: "Food industry marketing through exam and individual roleplay performance." },
  { name: "Marketing Communications Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "High", description: "Marketing communications strategies through exam and individual roleplay." },
  { name: "Quick Service Restaurant Management Series", category: "Hospitality", tags: ["Hospitality", "Presentation", "Combined Event"], popularity: "Moderate", description: "Fast food restaurant management through exam and individual roleplay." },
  { name: "Sports and Entertainment Marketing Series", category: "Marketing", tags: ["Marketing", "Presentation", "Combined Event"], popularity: "High", description: "Sports and entertainment marketing through exam and individual roleplay." },
  { name: "Full Service Restaurant Management Series", category: "Hospitality", tags: ["Hospitality", "Presentation", "Combined Event"], popularity: "High", description: "Upscale restaurant management including service and operations through combined event." },

  // Professional Selling and Consulting
  { name: "Financial Consulting", category: "Finance", tags: ["Finance", "Presentation", "Roleplay Performance"], popularity: "High", description: "Provide financial consulting services to clients through individual roleplay scenarios." },
  { name: "Professional Selling", category: "Sales", tags: ["Sales", "Presentation", "Roleplay Performance"], popularity: "High", description: "Demonstrate professional selling techniques and closing strategies through roleplay." },

  // Entrepreneurship Events
  { name: "Entrepreneurship - Starting a Business", category: "Entrepreneurship", tags: ["Entrepreneurship", "Business Management", "Written Event/Report"], popularity: "High", description: "Develop and present a comprehensive business plan for a new startup venture." },
  { name: "Entrepreneurship - Growing Your Business", category: "Entrepreneurship", tags: ["Entrepreneurship", "Business Management", "Written Event/Report"], popularity: "Moderate", description: "Create expansion strategies and growth plans for an existing business." },
  { name: "Entrepreneurship Innovation Plan", category: "Entrepreneurship", tags: ["Entrepreneurship", "Research", "Written Event/Report"], popularity: "Lower", description: "Develop and present an innovative business concept with detailed research and planning." },

  // Integrated Marketing Campaign Events
  { name: "Integrated Marketing Campaign - Product", category: "Marketing", tags: ["Marketing", "Research", "Written Event/Report"], popularity: "High", description: "Create complete integrated marketing campaign for a new product launch." },
  { name: "Integrated Marketing Campaign - Service", category: "Marketing", tags: ["Marketing", "Research", "Written Event/Report"], popularity: "High", description: "Develop comprehensive service marketing campaign with implementation plan." },
  { name: "Integrated Marketing Campaign - Event", category: "Marketing", tags: ["Marketing", "Research", "Written Event/Report"], popularity: "Moderate", description: "Design marketing campaign for special events and experiences." },

  // Business Operations Research Events
  { name: "Business Operations Research", category: "Business Management", tags: ["Business Management", "Research", "Written Event/Report"], popularity: "Lower", description: "Research business operations and develop comprehensive improvement strategies." },
  { name: "Finance Operations Research", category: "Finance", tags: ["Finance", "Research", "Written Event/Report"], popularity: "Lower", description: "Research financial strategies and develop detailed recommendations and analysis." },
  { name: "Hospitality Operations Research", category: "Hospitality", tags: ["Hospitality", "Research", "Written Event/Report"], popularity: "Lower", description: "Research hospitality industry operations and develop strategic improvements." },
  { name: "Marketing Operations Research", category: "Marketing", tags: ["Marketing", "Research", "Written Event/Report"], popularity: "Lower", description: "Comprehensive marketing research with strategic recommendations and implementation." },

  // Project Management Events
  { name: "Project Management - Community Awareness", category: "Business Management", tags: ["Business Management", "Leadership", "Written Event/Report"], popularity: "Lower", description: "Community service project with business management application and leadership development." },
  { name: "Project Management - Entrepreneurship", category: "Entrepreneurship", tags: ["Entrepreneurship", "Business Management", "Written Event/Report"], popularity: "Moderate", description: "Develop and execute entrepreneurial project with detailed planning and implementation." },

  // Professional Development Events
  { name: "Career Development Project", category: "Professional Development", tags: ["Leadership", "Research", "Written Event/Report"], popularity: "Moderate", description: "Develop personal career plan with research, goals, and professional development strategies." },
  { name: "Community Awareness Project", category: "Professional Development", tags: ["Leadership", "Research", "Written Event/Report"], popularity: "Lower", description: "Community service project demonstrating business leadership and social responsibility." },
  { name: "Community Giving Project", category: "Professional Development", tags: ["Leadership", "Research", "Written Event/Report"], popularity: "Lower", description: "Philanthropic project focusing on fundraising and community support initiatives." },

  // Team Events
  { name: "Advertising Campaign Team", category: "Marketing", tags: ["Marketing", "Team", "Presentation", "Written Event/Report"], popularity: "High", description: "Team development of complete advertising campaign with creative presentation." },
  { name: "Business Law and Ethics Team", category: "Business Management", tags: ["Business Management", "Team", "Presentation", "Written Event/Report"], popularity: "Moderate", description: "Team analysis of legal and ethical business cases with comprehensive solutions." },
  { name: "Business Services Team", category: "Business Management", tags: ["Business Management", "Team", "Presentation", "Written Event/Report"], popularity: "Moderate", description: "Team development of business services strategies and operational improvements." },
  { name: "Buying and Merchandising Team", category: "Business Management", tags: ["Business Management", "Team", "Presentation", "Written Event/Report"], popularity: "Moderate", description: "Team retail buying and merchandising plan development and presentation." },
  { name: "Financial Analyst Team", category: "Finance", tags: ["Finance", "Team", "Presentation", "Written Event/Report"], popularity: "High", description: "Team financial analysis and investment strategy development with presentation." },
  { name: "Hospitality Services Team", category: "Hospitality", tags: ["Hospitality", "Team", "Presentation", "Written Event/Report"], popularity: "Moderate", description: "Team development of hospitality service strategies and operational plans." },
  { name: "Marketing Management Team", category: "Marketing", tags: ["Marketing", "Team", "Presentation", "Written Event/Report"], popularity: "High", description: "Team strategic marketing plan development and comprehensive presentation." },
  { name: "Sports and Entertainment Marketing Team", category: "Marketing", tags: ["Marketing", "Team", "Presentation", "Written Event/Report"], popularity: "High", description: "Team sports and entertainment marketing plan development and creative presentation." },
  { name: "Travel and Tourism Team", category: "Hospitality", tags: ["Hospitality", "Team", "Presentation", "Written Event/Report"], popularity: "Moderate", description: "Team tourism industry plan development and strategic presentation." },

  // Written Events
  { name: "Business Growth Plan", category: "Business Management", tags: ["Business Management", "Written Event/Report"], popularity: "Moderate", description: "Develop comprehensive business growth strategy with financial projections and implementation." },
  { name: "Financial Statement Analysis", category: "Finance", tags: ["Finance", "Written Event/Report"], popularity: "Moderate", description: "Analyze financial statements and develop investment recommendations and insights." },
  { name: "Franchise Business Plan", category: "Entrepreneurship", tags: ["Entrepreneurship", "Written Event/Report"], popularity: "Lower", description: "Develop complete franchise business plan with market analysis and financials." },
  { name: "International Business Plan", category: "Business Management", tags: ["Business Management", "Written Event/Report"], popularity: "Lower", description: "Create international business expansion plan with global market analysis." },
  { name: "Small Business Management Plan", category: "Entrepreneurship", tags: ["Entrepreneurship", "Written Event/Report"], popularity: "High", description: "Develop comprehensive small business management and operations plan." },

  // Specialized Events
  { name: "Banking and Financial Services", category: "Finance", tags: ["Finance", "Presentation", "Roleplay Performance"], popularity: "Moderate", description: "Banking operations and financial services through roleplay scenarios and case studies." },
  { name: "Human Resources Management", category: "Business Management", tags: ["Business Management", "Presentation", "Roleplay Performance"], popularity: "High", description: "HR strategies and management through roleplay scenarios and personnel decisions." },
  { name: "Insurance Services", category: "Finance", tags: ["Finance", "Presentation", "Roleplay Performance"], popularity: "Lower", description: "Insurance services and risk management through roleplay scenarios and client consultations." },
  { name: "Real Estate Business Management", category: "Business Management", tags: ["Business Management", "Presentation", "Roleplay Performance"], popularity: "Lower", description: "Real estate business operations and management through roleplay scenarios." },
  { name: "Retail Merchandising", category: "Marketing", tags: ["Marketing", "Presentation", "Roleplay Performance"], popularity: "Moderate", description: "Retail strategies and merchandising through roleplay scenarios and visual presentations." },

  // Emerging Technology Events
  { name: "E-Commerce", category: "Marketing", tags: ["Marketing", "Technology", "Written Event/Report"], popularity: "High", description: "Develop e-commerce business strategy with digital marketing and technology integration." },
  { name: "Social Media Marketing", category: "Marketing", tags: ["Marketing", "Technology", "Written Event/Report"], popularity: "High", description: "Create social media marketing campaign with platform strategies and analytics." },

  // Chapter Events
  { name: "Chapter Business Plan", category: "Chapter Events", tags: ["Business Management", "Team", "Written Event/Report"], popularity: "Moderate", description: "Develop comprehensive business plan for DECA chapter operations and activities." },
  { name: "Chapter Community Service Project", category: "Chapter Events", tags: ["Leadership", "Team", "Written Event/Report"], popularity: "Lower", description: "Chapter-wide community service project with planning and impact measurement." },
  { name: "Chapter Financial Report", category: "Chapter Events", tags: ["Finance", "Team", "Written Event/Report"], popularity: "Lower", description: "Chapter financial management and reporting with budget analysis and planning." }
];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-white/90 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: `linear-gradient(45deg, #055ee4, #668a00, #d61919)` }}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                DECA Event Recommender
              </h1>
              <p className="text-sm text-gray-600">
                Find your perfect competitive event
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Discover Your Perfect DECA Event
            </h2>
            
            <p className="text-xl mb-8 leading-relaxed text-gray-600">
              Not sure which DECA competitive event matches your skills and career interests? 
              Our smart recommendation tool analyzes your strengths, experience, and preferences to suggest the best events for you.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-2xl bg-white/80 border border-gray-100 shadow-sm backdrop-blur-sm">
                <Target className="w-8 h-8 mx-auto mb-3" style={{ color: decaColors.primary }} />
                <h3 className="font-semibold mb-2 text-gray-900">
                  Personalized Matching
                </h3>
                <p className="text-sm text-gray-600">
                  Get recommendations based on your unique skill set
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white/80 border border-gray-100 shadow-sm backdrop-blur-sm">
                <Users className="w-8 h-8 mx-auto mb-3" style={{ color: decaColors.secondary }} />
                <h3 className="font-semibold mb-2 text-gray-900">
                  Competition Insights
                </h3>
                <p className="text-sm text-gray-600">
                  Learn about event popularity and preparation requirements
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white/80 border border-gray-100 shadow-sm backdrop-blur-sm">
                <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: decaColors.accent }} />
                <h3 className="font-semibold mb-2 text-gray-900">
                  Career Focused
                </h3>
                <p className="text-sm text-gray-600">
                  Align events with your future business career goals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="p-8 rounded-3xl bg-white/90 border border-gray-100 shadow-lg backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Search className="w-6 h-6" style={{ color: decaColors.primary }} />
              Tell Us About Your Skills & Interests
            </h3>
            
            <div className="space-y-8">
              {/* Skills Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  What are your top business skills? (Rank by importance)
                </label>
                <SkillOrdering 
                  skills={orderedSkills} 
                  onOrderChange={setOrderedSkills} 
                />
              </div>

              {/* Prep Style Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  What type of event preparation do you prefer?
                </label>
                <div className="space-y-3">
                  {prepStyleOptions.map(style => (
                    <label 
                      key={style} 
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:shadow-sm border ${
                        otherFormData.prepStyle === style 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-gray-200'
                      }`}
                      style={otherFormData.prepStyle === style ? { borderColor: decaColors.primary } : {}}
                    >
                      <input
                        type="radio"
                        name="prepStyle"
                        value={style}
                        checked={otherFormData.prepStyle === style}
                        onChange={(e) => setOtherFormData(prev => ({...prev, prepStyle: e.target.value}))}
                        className="w-4 h-4"
                        style={{ accentColor: decaColors.primary }}
                      />
                      <span className="font-medium text-gray-900">
                        {style}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  What business experience do you have?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {experienceOptions.map(exp => (
                    <label 
                      key={exp} 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-sm border ${
                        otherFormData.experience.includes(exp) 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-white border-gray-200'
                      }`}
                      style={otherFormData.experience.includes(exp) ? { borderColor: decaColors.accent } : {}}
                    >
                      <input
                        type="checkbox"
                        checked={otherFormData.experience.includes(exp)}
                        onChange={() => handleExperienceChange(exp)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: decaColors.accent }}
                      />
                      <span className="font-medium text-gray-900">
                        {exp}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Team or Solo Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  Do you prefer team or individual events?
                </label>
                <div className="space-y-3">
                  {["Team", "Solo", "I don't care"].map(option => (
                    <label 
                      key={option} 
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:shadow-sm border ${
                        otherFormData.teamPreference === option 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                      style={otherFormData.teamPreference === option ? { borderColor: decaColors.green } : {}}
                    >
                      <input
                        type="radio"
                        name="teamPreference"
                        value={option}
                        checked={otherFormData.teamPreference === option}
                        onChange={(e) => setOtherFormData(prev => ({ ...prev, teamPreference: e.target.value }))}
                        className="w-4 h-4"
                        style={{ accentColor: decaColors.green }}
                      />
                      <span className="font-medium text-gray-900">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Popularity Preference */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-gray-900">
                  What competition level interests you?
                </label>
                <div className="space-y-3">
                  {popularityOptions.map(option => (
                    <label 
                      key={option} 
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:shadow-sm border ${
                        otherFormData.popularity === option 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-white border-gray-200'
                      }`}
                      style={otherFormData.popularity === option ? { borderColor: decaColors.yellow } : {}}
                    >
                      <input
                        type="radio"
                        name="popularity"
                        value={option}
                        checked={otherFormData.popularity === option}
                        onChange={(e) => setOtherFormData(prev => ({...prev, popularity: e.target.value}))}
                        className="w-4 h-4"
                        style={{ accentColor: decaColors.yellow }}
                      />
                      <span className="font-medium text-gray-900">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 font-semibold cursor-pointer py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{ background: decaColors.gradient }}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      Get DECA Recommendations
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearForm}
                  className="px-6 py-4 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="lg:sticky lg:top-24">
            {showRecommendations ? (
              <div className="p-8 rounded-3xl bg-white/90 border border-gray-100 shadow-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <CheckCircle className="w-6 h-6" style={{ color: decaColors.green }} />
                  Your DECA Event Recommendations
                </h3>
                
                <div className="space-y-6">
                  {recommendations.slice(0, visibleCount).map((event, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-2xl transition-shadow hover:shadow-md border border-gray-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-xl font-bold text-gray-900">
                          {event.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">
                            {event.match}% match
                          </div>
                          <div className="w-12 h-2 rounded-full overflow-hidden bg-gray-100">
                            <div 
                              className="h-full"
                              style={{ 
                                width: `${event.match}%`,
                                background: decaColors.gradient
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="mb-4 text-gray-600">
                        {event.description}
                      </p>
                      
                      <div className="mb-4">
                        <span 
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full text-white ${
                            event.popularity === "High" ? "bg-green-600" :
                            event.popularity === "Moderate" ? "bg-amber-500" :
                            "bg-blue-600"
                          }`}
                        >
                          {event.popularity} Competition
                        </span>
                      </div>
                      
                      {/* Show which skills matched */}
                      {orderedSkills.some(skill => event.tags.includes(skill)) && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2 text-gray-700">Matched Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {orderedSkills
                              .filter(skill => event.tags.includes(skill))
                              .map((skill, idx) => (
                                <span 
                                  key={skill} 
                                  className="px-3 py-1 text-sm font-medium rounded-full text-white"
                                  style={{ background: decaColors.primary }}
                                >
                                  {skill} #{idx + 1}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-3 py-1 text-sm font-medium rounded-full"
                            style={{ background: decaColors.accent, color: 'white' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {visibleCount < recommendations.length && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="mt-4 px-4 py-2 rounded-xl font-medium text-sm border transition-all hover:bg-gray-50"
                    style={{ color: decaColors.blue, borderColor: decaColors.blue }}
                  >
                    Load More Events
                  </button>
                )}

                <div className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <p className="text-sm" style={{ color: decaColors.blue }}>
                    💡 <strong>Pro tip:</strong> These recommendations are ranked by how well they match your skills and career interests. 
                    Top matches align with DECA's focus on preparing emerging leaders and entrepreneurs!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl text-center bg-white/70 border border-gray-200 backdrop-blur-sm">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white"
                  style={{ background: decaColors.gradient }}
                >
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Ready for DECA Recommendations?
                </h3>
                <p className="text-gray-600">
                  Fill out the form to discover your perfect DECA competitive events!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DECAEventRecommender;