import Head from 'next/head'
import Link from 'next/link'
import HeaderMain from '../components/header_main'

export default function FourOhFour() {
  return (
    <div>
      <HeaderMain title="ไม่พบหน้าที่ต้องการค้นหา" />
      <main className='container-center' style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
        <h1>404 - Page Not Found</h1>
        <Link href="/">
          <a>
            กลับไปหน้าหลัก
          </a>
        </Link>
      </main>
    </div>
  )
}