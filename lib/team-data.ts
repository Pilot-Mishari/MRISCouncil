export type Member = { name: string; role: string; grade?: string; bio?: string; description?: string };

// Placeholder one-sentence description. Replace per head with the real one when you have it.
const LOREM = "This person decided to be boring";

export const leadership: Member[] = [
  { name: "Arar Mutlag Alajmi", role: "President", bio: LOREM },
  { name: "Rayyan Nawwab", role: "Vice President", bio: "I bring all our departments together, keep everyone working in sync, prioritising both fun and actually getting things done." },
  { name: "Omar Al-Ajjuri", role: "Events Coordinator", bio: "I run it, ask me" },
  { name: "Khalid Walid Alismail", role: "Advisor", bio: LOREM },
];

export const departments: { name: string; heads: Member[]; members: Member[] }[] = [
  { name: "IT",
    heads: [{ name: "Abdulrahman Turkestani", role: "Head of IT 1", description: LOREM }, { name: "Shayan Saeed", role: "Head of IT 2", description: "Yes, I only used A BIT of AI for the site" }],
    members: [{ name: "Rayan Nasser Dasta", role: "Better Call Rayan, Consider it Done"}, { name: "Adel Al Madani", role: "Member" }] },
  { name: "Activities",
    heads: [{ name: "Suleiman Banday", role: "Head 1", description: "“ion run it ask bullah zeeshan”" }, { name: "Abdullah Zeeshan", role: "Head 2", description: "“ion run it ask suli”" }],
    members: [{ name: "Bilal Mohannad Alkudwah", role: "Co Head" }, { name: "Abdullah Saad Baqai", role: "Member" }] },
  { name: "Clubs",
    heads: [{ name: "Syed Mubashir Hussain", role: "Head 1", description: LOREM }, { name: "Omar Fahim Syed", role: "Head 2", description: "1000 interests only 1 lifetime" }],
    members: [{ name: "Bilal Bahaa Eddin Al Hakeem", role: "Co Head" }, { name: "Mohammed Abdullah Alkhaibari", role: "Member" }] },
  { name: "Finance",
    heads: [{ name: "Ghassan Amir Elhassan", role: "Head 1", description: LOREM }, { name: "Muhammad Humayun Naveed", role: "Head 2", description: "I’m passionate about finance, taking initiative, and making a difference in my school community." }],
    members: [{ name: "Faris Thamer Alquthami", role: "Co Head" }, { name: "Talal Muffareh Nahari", role: "Member" }] },
  { name: "Volunteering",
    heads: [{ name: "Hassan Husham Hassan Mohammed", role: "Head 1", description: LOREM }, { name: "Ahmed Alaa", role: "Head 2", description: LOREM }],
    members: [{ name: "Ahmad Yasser Alsaqabi", role: "Co Head" }, { name: "Razyn Alharbi", role: "Member" }] },
  { name: "Media and PR",
    heads: [{ name: "Fayed Abdulkareem", role: "Head 1", description: "Fade away fade away young man fade awayyy" }, { name: "Ayaan Fahad", role: "Head 2", description: LOREM }],
    members: [{ name: "Abdulrahman Faisal Alturki", role: "Co Head" }, { name: "Ahmed Jamiel", role: "Co Head" }, { name: "Abdulkareem Abdul Rahman Al Eissa", role: "Member" }] },
  { name: "Newsletter",
    heads: [{ name: "Abdullah Habibullah Chaudhary", role: "Editor in Chief", description: LOREM }],
    members: [
      { name: "Mohammed Nagi Omar", role: "We find news we make news weekly news" },
      { name: "Mohammad Bander", role: "Senior Reporter" },
      { name: "Aley Basem Osama", role: "Senior Reporter" },
      { name: "Abdulaziz Osama Alhamad", role: "Junior Writer" },
    ] },
  { name: "Photography",
    heads: [{ name: "Ghassan Yousef Alshayeb", role: "Head 1", description: LOREM }, { name: "Ammar Anwar", role: "Head 2", description: "I take the pictures, so if you look bad in the yearbook, that's between you and the lighting" }],
    members: [
      { name: "Hamad Watban M Altabayanawy", role: "Co Head" },
      { name: "Mustafa Mohammed Farook Badiuddin", role: "Member" },
      { name: "Nawaf Ramy Alduraihem", role: "Member" },
    ] },
];

export const classReps: Member[] = [
  { name: "Naif Bin Hisham Alessa", role: "", grade: "G10AM" },
  { name: "Zayd Mir", role: "", grade: "G10BR" },
  { name: "Yassin Waleed Shawky", role: "", grade: "G11AM" },
  { name: "Mustapha Mohamad Elchami", role: "", grade: "G11BR" },
  { name: "Abdulaziz Ayad Yousef Aldaijy", role: "", grade: "G12AM" },
  { name: "Mekael Usman Mahmood", role: "", grade: "G12BR" },
];