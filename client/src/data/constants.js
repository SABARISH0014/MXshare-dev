export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// MCA Syllabus Structure — As per uploaded PDF

export const syllabusData = {
  semesters: [
    { name: "Semester 1", value: "1" },
    { name: "Semester 2", value: "2" },
    { name: "Semester 3", value: "3" },
    { name: "Semester 4", value: "4" } // ✅ Added back
  ],

  subjects: [
    // Semester 1 Core
    "Mathematical Foundations of Computer Science",
    "Structured Programming Concepts",
    "Data Structures",
    "Database Systems",
    "Web Technologies",
    "C Programming Laboratory",
    "Data Structures Laboratory",
    "Web Application Development",

    // Semester 2 Core
    "Software Engineering",
    "Design and Analysis of Algorithms",
    "Object Oriented Programming using Java",
    "Enterprise Computing Using Full Stack",
    "Java Programming Laboratory",
    "Mobile Application Development",
    "Professional Communication And Personality Development",

    // Semester 3 Core
    "Cloud Computing",
    "Cloud Computing Laboratory",
    "Mini Project",
    "Audit Course",

    // Semester 4 Core
    "Project Work", // ✅ Added back

    // Semester 3 Electives
    "Design Patterns",
    "Software Project Management",
    "Security in Computing",
    "Soft Computing",
    "Computer Networks",
    "Data Mining and Analytics",
    "Artificial Intelligence",
    "Machine Learning",
    "Internet of Things",
    "Wireless Networks",
    "Deep Learning",
    "Multidimensional Data Structures",
    "Open Source Systems",
    "Ubiquitous and Pervasive Computing",
    "Human Computer Interaction",
    "Principles of Compiler Design",
    "Social Networking and Web Mining",
    "Virtual Reality Systems",
    "Block Chain Technologies and Use Cases",
    "DevOps",
    "Software Testing",
    "Operating Systems",
    "Optimization Techniques",
    "Numerical Methods",
    "Applied Graph Theory",
    "Entrepreneurship",
    "Principles of Management and Behavioural Sciences",
    "Accounting and Financial Management"
  ]
};

// Sample Data
export const mockNoteList = [
  { id: 1, title: 'Cloud Computing (Unit 1 & 2)', date: '2025-11-15', contributor: 'Karthik Sundar', subject: 'Cloud Computing', downloads: 120, rating: 4.8 },
  { id: 2, title: 'Complete Data Structures Unit 1-5', date: '2025-10-28', contributor: 'Priya R.', subject: 'Data Structures', downloads: 85, rating: 4.2 },
  { id: 3, title: 'Supervised vs Unsupervised ML', date: '2025-09-10', contributor: 'Arun K.', subject: 'Machine Learning', downloads: 200, rating: 4.9 },
  { id: 4, title: 'DBMS 2-Mark Questions', date: '2025-12-01', contributor: 'Nisha V.', subject: 'Database Systems', downloads: 90, rating: 4.5 },
  { id: 5, title: 'Full Stack MERN Architecture Diagram', date: '2025-11-20', contributor: 'Vikram S.', subject: 'Enterprise Computing Using Full Stack', downloads: 150, rating: 4.7 },
];

export const mockContributors = [
  { id: 1, name: 'Priya R.', department: 'ECE', score: 980, notes: 45, reviews: 150, rating: 4.9 },
  { id: 2, name: 'Arun K.', department: 'Mech', score: 870, notes: 32, reviews: 90, rating: 4.7 },
  { id: 3, name: 'Nisha V.', department: 'CSE', score: 750, notes: 55, reviews: 110, rating: 4.5 },
  { id: 4, name: 'Vikram S.', department: 'IT', score: 620, notes: 28, reviews: 60, rating: 4.3 },
  { id: 5, name: 'Sanjay A.', department: 'EEE', score: 500, notes: 12, reviews: 45, rating: 4.1 },
];
