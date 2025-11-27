export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const syllabusData = {
  semesters: [
    { name: "Semester 1", value: "sem1" },
    { name: "Semester 2", value: "sem2" },
    { name: "Semester 3", value: "sem3" },
    { name: "Semester 4", value: "sem4" }
  ],
  subjects: [
    "Mathematical Foundations of Computer Science", "Structured Programming Concepts", "Data Structures", "Database Systems", "Web Technologies",
    "Software Engineering", "Design and Analysis of Algorithms", "Object Oriented Programming using Java", "Enterprise Computing Using Full Stack",
    "Cloud Computing", "Project Work", "Accounting and Financial Management", "Applied Graph Theory", "Artificial Intelligence", "Block Chain Technologies and Use Cases",
    "Computer Networks", "Data Mining and Analytics", "Deep Learning", "Design Patterns", "DevOps", "Entrepreneurship", "Human Computer Interaction",
    "Internet of Things", "Machine Learning", "Multidimensional Data Structures", "Numerical Methods", "Open Source Systems", "Operating Systems",
    "Optimization Techniques", "Principles of Compiler Design", "Principles of Management and Behavioural Sciences", "Security in Computing",
    "Social Networking and Web Mining", "Soft Computing", "Software Project Management", "Software Testing", "Ubiquitous and Pervasive Computing",
    "Virtual Reality Systems", "Wireless Networks"
  ].sort()
};

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
