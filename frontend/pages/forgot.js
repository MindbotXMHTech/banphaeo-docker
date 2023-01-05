import Head from 'next/head'
import Link from 'next/link' 
import styles from '../styles/index.module.css';
import { useEffect, useState } from 'react';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Input, Col, Row } from 'antd';
import { useRouter } from 'next/router';
import NavMain from '../components/nav_main';
import FooterMain from '../components/footer_main';
import LoadingMain from '../components/loading_main'
import HeaderMain from '../components/header_main';

export default function Register() {
  const [signinState, setSigninState] = useState(null)
  const [siteToken, setSiteToken] = useState(null)
  const [inp, setInp] = useState()
  const [inpRePasswordStatus, setInpRePasswordStatus] = useState(null)
  const [requestState, setRequestState] = useState(1)
  const [otp, setOtp] = useState()
  const [otpRef, setOtpRef] = useState()

  const router = useRouter()

  function clickNext() {
    if (requestState === 1) {
      // TODO send forgot req
    }
    else if (requestState === 2) {
      // TODO send reset req
    }
    else if (requestState === 3) {
      // TODO send update password
    }
    setRequestState((prev) => {return prev+1})
  }

  useEffect(() => {
    setSiteToken(localStorage.getItem("site-token"))
  }, [])

  useEffect(() => {
    if (siteToken === null) {
      setSigninState(false)
    }
    else {
      // TODO validate token (get /me)
      setSigninState(true)
      router.push('/')
    }
  }, [siteToken, router])

  return (
    <div>
      <HeaderMain title="ลืมรหัสผ่าน" />
      
      <main>
        <NavMain/>
        {signinState === null &&
          <LoadingMain/>
        }
        {signinState === false &&
          <div className={styles.signinContainer}>
            <div className={styles.signinContent}>
              <p className={styles.signinTitle}>ลืมรหัสผ่าน?</p>
              
              {requestState === 1 && 
                <div>
                  <Row>
                    <Col><Button type="primary" shape="circle">1</Button>&nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="default" shape="circle">2</Button>&nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="default" shape="circle">3</Button>&nbsp;เปลี่ยนรหัสผ่าน</Col>
                  </Row>
                  <br />
                  <Input type='email' placeholder="อีเมล" onChange={(e) => {setInp(e.target.value)}} />
                  <br />
                  <br />
                  <div style={{'display':'flex', 'flexDirection':'column'}}>
                    <Button type="primary" shape="round" size='middle' onClick={clickNext}>
                      ขอรับรหัส OTP
                    </Button>
                    <Link href="/">
                      <Button type="link" size='middle' style={{color:'grey'}}>
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              }
              {requestState === 2 && 
                <div>
                  <Row>
                    <Col><Button type="default" shape="circle" disabled>1</Button>&nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="primary" shape="circle">2</Button>&nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="default" shape="circle">3</Button>&nbsp;เปลี่ยนรหัสผ่าน</Col>
                  </Row>
                  <br />
                  <Input type='text' placeholder={"กรอกรหัส OTP [ref: "+otpRef+"]"} onChange={(e) => {setInp(e.target.value)}} />
                  <br />
                  <br />
                  <div style={{'display':'flex', 'flexDirection':'column'}}>
                    <Button type="primary" shape="round" size='middle' onClick={clickNext}>
                      ถัดไป
                    </Button>
                    <Link href="/">
                      <Button type="link" size='middle' style={{color:'grey'}}>
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              }
              {requestState === 3 && 
                <div>
                  <Row>
                    <Col><Button type="default" shape="circle" disabled>1</Button>&nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="default" shape="circle" disabled>2</Button>&nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;</Col>
                    <Col><Button type="primary" shape="circle">3</Button>&nbsp;เปลี่ยนรหัสผ่าน</Col>
                  </Row>
                  <br />
                  <Input.Password 
                    placeholder="รหัสผ่าน" 
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    onChange={(e) => {setInp(e.target.value)}}
                  />
                  <br />
                  <br />
                  <Input.Password 
                    style={{border:inpRePasswordStatus}}
                    placeholder="ยืนยันรหัสผ่าน" 
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    onChange={(e) => {
                      if (e.target.value === inp) {
                        setInpRePasswordStatus(null)
                      }
                      else {
                        setInpRePasswordStatus('1px solid red')
                      }
                    }}
                  />
                  <br />
                  <br />
                  <div style={{'display':'flex', 'flexDirection':'column'}}>
                    <Button type="primary" shape="round" size='middle' onClick={clickNext}>
                      ถัดไป
                    </Button>
                    <Link href="/">
                      <Button type="link" size='middle' style={{color:'grey'}}>
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </main>

      <FooterMain/>
    </div>
  )
}
