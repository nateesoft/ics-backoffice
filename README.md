# ics-backofficeProject Issue Task Tracking

Frontend: NextJS prefix=ics-backoffice
Backend: NestJS
Database: Postgresql [ใช้ jdbc นี้ครับ postgresql://postgres:password@localhost:5432/ics-backoffice]

Detail:
    ผมต้องการสร้างระบบสำหรับ Tracking Bug issue ครับ เน้นเรียบง่าย ใช้งานง่าย โดยข้อมูลสำหรับ New Issue Task มีข้อมูลดังนี้
    --------------------------------------------
    ### ISSUE TASK FORM ###
    Project Name:
    Code Type: [Java, NodeJS, NestJS, NextJS, ReactJS, Java Springboot, Python, Golang]
    Detail: [text]
    Github Link: [text]
    Issue Create Date: [default current date]
    Priority Task: [Critical, High, Medium, Low]
    Task Work Period: [Days, Hours]
    Target Date: [Calendar Pickup]
    Issuer: [text]
    Developer: [text]
    Tester: [text]
    Task Status: [New, Todo, InProgress, Test, Done]
    Deployment Status: [Wait Approve, Wait Deploy, Deployed]
    Anydesk: [text]
    TeamViewer: [text]
    Contract Detail: [text]
    --------------------------------------------

1. มีระบบ Login (ข้อมูล default: username=admin, password=admin) หลังจาก Login สำเร็จจะเก็บข้อมูลไว้ใน JWT Cookies
2. มีหน้า dashboard โดยแบ่งเป็น Sidebar และ Dashboard Content
    2.1 สำหรับ Sidebar จะรองรับ Responsive สำหรับ Mobile ถ้าเป็น Mobile ให้แสดงเป็น Hamburger Menu ถ้าเป็นหน้าจอปกติ ก็ยังสามารถย่อ ขยายซ่อนเมนูได้
        2.1.1 มีเมนูรายการ Issue Task Ticket ทั้งหมดที่เคยสร้าง
            2.1.1.1 ใช้ข้อมูลจาก ### ISSUE TASK FORM ### เพื่อสร้าง, แก้ไข, ยกเลิก (แต่ไม่ลบออกจากระบบ)
        2.1.2 มีเมนูรายงานสำหรับรายการ Issue Task ทั้งหมด
            2.1.2.1 แสดงภาพรวม Issue ทั้งหมดของ Task ตามความเหมาะสม
    2.2 สำหรับ Dashboard Content สามารถ Switch เลือกได้ว่าจะแสดงเป็น Calendar Schedule หรือจะแสดง Task แบบ Trello Style
        2.2.1 ถ้าเป็นหน้า Calendar Schedule เมื่อ click เลือกวันที่จากใน Calendar จะสามารถ Create New Issue Task ได้
        2.2.2 ถ้าเป็นหน้า Trello Style จะมีสามารถ Create New Issue Task ได้ตาม Lane เลย
    2.3 มีปุ่ม Logout อยู่มุมขวาบน เมื่อเลือกจะกลับไปสู่หน้า Login


To start:
Make sure PostgreSQL is running with database ics-backoffice
Backend: cd backend && npm run start:dev
Frontend: cd frontend && npm run dev
Open http://localhost:3000 → login with admin / admin
Or run both together: ./start.sh
