<h1>
  WardWatch |
  <a href="https://ward-watch.vercel.app/" style="font-size: 18px;"> Live Demo</a>
</h1>


<p align="center">
  <b>Know every bed. Every patient. Every second.</b>
</p>


<p align="center">
  <img src="https://img.shields.io/badge/Backend-SpringBoot-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/RealTime-WebSockets-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
</p>

---

## 📌 Overview

WardWatch is a **real-time hospital ward management system** that provides complete visibility into bed availability and patient flow.

Instead of relying on manual registers and delayed updates, WardWatch delivers a **live dashboard** that enables hospital staff to make faster, more accurate decisions.

---

## 🎯 Problem

- No real-time visibility of ward and bed status  
- Information scattered across systems and manual records  
- Delayed discharges blocking bed availability  
- Inefficient bed utilization  
- Decisions based on outdated data  

---

## 💡 Solution

WardWatch provides a **centralized, real-time system** for managing ward operations efficiently.

- Live tracking of bed status  
- Automatic bed allocation and updates  
- Multi-ward monitoring  
- Role-based access control  
- Shift handover summaries (printable)  
- Smart alerts for delays and capacity  

---

## 🖼️ System Preview

### 🔐 Login Screens
<p align="center">
  <img src="./login1.jpg" width="45%" />
  <img src="./login2.jpg" width="45%" />
</p>

---

### 👨‍💼 Admin Dashboard
<p align="center">
  <img src="./admin1.jpg" width="45%" />
  <img src="./admin2.jpg" width="45%" />
</p>

---

### 👩‍⚕️ Staff View
<p align="center">
  <img src="./staff1.jpg" width="45%" />
  <img src="./staff2.jpg" width="45%" />
</p>

---

## 🏗️ Architecture

```
Client (Frontend)
        ↓
Spring Boot API Layer
        ↓
Business Logic (Bed Allocation, Queue, Alerts)
        ↓
WebSocket Layer (Real-time Updates)
        ↓
PostgreSQL Database (Local / Supabase)
```





---

## ⚙️ Configuration

### 🔁 Profiles

This project supports multiple environments:

#### ▶️ Local Development
```
spring.profiles.active=local
```

#### ☁️ Production (Supabase)
```
spring.profiles.active=prod
```

---

## 🚀 Running the Project

```bash
# Clone the repository
git clone https://github.com/SujalPatil21/WardWatch.git

# Navigate to project
cd WardWatch

# Run application
./mvnw spring-boot:run
```

---

## 📊 Impact

- ⚡ Faster decision-making  
- 🏥 Improved bed utilization  
- 🔄 Efficient patient flow management  
- 📈 Better operational visibility  

---

## 🔮 Future Enhancements

- AI-based bed prediction  
- Mobile app integration  
- Analytics dashboard  
- Hospital-wide scalability  

---

## 👨‍💻 Author

**Shreya Awari**
**Sujal Patil**
**Tejas Halvankar**


---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

---

## 📄 License

This project is for academic and demonstration purposes.