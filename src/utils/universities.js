/**
 * Comprehensive list of Indian universities and colleges
 * Organized by category for easy selection
 */

export const UNIVERSITIES = [
  // IITs
  { category: 'IIT', name: 'IIT Bombay' },
  { category: 'IIT', name: 'IIT Delhi' },
  { category: 'IIT', name: 'IIT Madras' },
  { category: 'IIT', name: 'IIT Roorkee' },
  { category: 'IIT', name: 'IIT Kharagpur' },
  { category: 'IIT', name: 'IIT Kanpur' },
  { category: 'IIT', name: 'IIT Guwahati' },
  { category: 'IIT', name: 'IIT Hyderabad' },
  { category: 'IIT', name: 'IIT Indore' },
  { category: 'IIT', name: 'IIT Bhubaneswar' },
  { category: 'IIT', name: 'IIT Varanasi' },
  { category: 'IIT', name: 'IIT Jammu' },
  { category: 'IIT', name: 'IIT Mandi' },
  { category: 'IIT', name: 'IIT Tirupati' },
  { category: 'IIT', name: 'IIT Palakkad' },
  { category: 'IIT', name: 'IIT Goa' },
  { category: 'IIT', name: 'IIT Dhanbad (ISM)' },
  { category: 'IIT', name: 'IIT Bhilai' },

  // NITs
  { category: 'NIT', name: 'NIT Warangal' },
  { category: 'NIT', name: 'NIT Rourkela' },
  { category: 'NIT', name: 'NIT Surathkal' },
  { category: 'NIT', name: 'NIT Trichy' },
  { category: 'NIT', name: 'NIT Allahabad' },
  { category: 'NIT', name: 'NIT Bhopal' },
  { category: 'NIT', name: 'NIT Jalandhar' },
  { category: 'NIT', name: 'NIT Jaipur' },
  { category: 'NIT', name: 'NIT Kurukshetra' },
  { category: 'NIT', name: 'NIT Hamirpur' },
  { category: 'NIT', name: 'NIT Durgapur' },
  { category: 'NIT', name: 'NIT Silchar' },
  { category: 'NIT', name: 'NIT Srinagar' },
  { category: 'NIT', name: 'NIT Calicut' },
  { category: 'NIT', name: 'NIT Nagpur' },
  { category: 'NIT', name: 'NIT Raipur' },
  { category: 'NIT', name: 'NIT Surat' },
  { category: 'NIT', name: 'NIT Udaipur' },
  { category: 'NIT', name: 'NIT Agartala' },
  { category: 'NIT', name: 'NIT Goa' },
  { category: 'NIT', name: 'NIT Uttarakhand' },
  { category: 'NIT', name: 'NIT Puducherry' },
  { category: 'NIT', name: 'NIT Andhra Pradesh' },
  { category: 'NIT', name: 'NIT Manipur' },
  { category: 'NIT', name: 'NIT Mizoram' },
  { category: 'NIT', name: 'NIT Patna' },

  // IIIT
  { category: 'IIIT', name: 'IIIT Hyderabad' },
  { category: 'IIIT', name: 'IIIT Delhi' },
  { category: 'IIIT', name: 'IIIT Bangalore' },
  { category: 'IIIT', name: 'IIIT Allahabad' },
  { category: 'IIIT', name: 'IIIT Pune' },
  { category: 'IIIT', name: 'IIIT Nagpur' },
  { category: 'IIIT', name: 'IIIT Guwahati' },

  // Top Private Universities & Colleges
  { category: 'Top Colleges', name: 'BITS Pilani' },
  { category: 'Top Colleges', name: 'VIT Vellore' },
  { category: 'Top Colleges', name: 'NMIMS Mumbai' },
  { category: 'Top Colleges', name: 'SP Jain Mumbai' },
  { category: 'Top Colleges', name: 'Manipal Institute of Technology' },
  { category: 'Top Colleges', name: 'JNTU Hyderabad' },
  { category: 'Top Colleges', name: 'Anna University Chennai' },
  { category: 'Top Colleges', name: 'Pune University' },
  { category: 'Top Colleges', name: 'Delhi University' },
  { category: 'Top Colleges', name: 'Jamia Millia Islamia' },
  { category: 'Top Colleges', name: 'Aligarh Muslim University' },
  { category: 'Top Colleges', name: 'Banaras Hindu University' },
  { category: 'Top Colleges', name: 'COEP Pune' },
  { category: 'Top Colleges', name: 'NUS Singapore (Offshore)' },
  { category: 'Top Colleges', name: 'PSG College of Technology' },
  { category: 'Top Colleges', name: 'Ramaiah Institute of Technology' },
  { category: 'Top Colleges', name: 'PES University' },
  { category: 'Top Colleges', name: 'Symbiosis Pune' },
  { category: 'Top Colleges', name: 'LJIET Ahmedabad' },
  { category: 'Top Colleges', name: 'Thadomal Shahani Engineering College' },
  { category: 'Top Colleges', name: 'DJ Sanghvi College of Engineering' },
  { category: 'Top Colleges', name: 'CBIT Hyderabad' },
  { category: 'Top Colleges', name: 'Osmania University' },
  { category: 'Top Colleges', name: 'KIIT Bhubaneswar' },
  { category: 'Top Colleges', name: 'Bennett University' },
  { category: 'Top Colleges', name: 'Shiv Nadar University' },

  // Add Other option
  { category: 'Other', name: 'Other' },
];

export function getUniversitiesByCategory(category) {
  return UNIVERSITIES.filter((u) => u.category === category).map((u) => u.name);
}

export function getAllCategories() {
  return ['IIT', 'NIT', 'IIIT', 'Top Colleges', 'Other'];
}
