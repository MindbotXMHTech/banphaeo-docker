// https://stackoverflow.com/a/22877110/16916768
import Head from 'next/head'
import Link from 'next/link' 
import styles from '../styles/index.module.css';
import { io } from "socket.io-client";
import { useEffect, useState } from 'react';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Input, message } from 'antd';
import Router from 'next/router';
import NavMain from '../components/nav_main';
import FooterMain from '../components/footer_main';
import LoadingMain from '../components/loading_main';
import NavSide from '../components/nav_side';
import HeaderMain from '../components/header_main';
import CardMed from '../components/card_med';
import apis from '../manager/apis';
import utilFuncs from '../manager/utils';
import vars from '../store/vars'

export default function Main() {
  const socket = io(vars["SOCKET_URI"], {reconnectionDelayMax: 1000})
  const [signinState, setSigninState] = useState(null)
  const [siteToken, setSiteToken] = useState(null)
  const [inpEmail, setInpEmail] = useState()
  const [inpPassword, setInpPassword] = useState()
  const [data, setData] = useState({
    "success": [],
    "error": [],
    "warning": []
  })

  async function clickSignin() {
    let res = await apis.login(inpEmail, inpPassword);
    if (res.success) {
      message.success(res.msg);

      let token = "mock"
      localStorage.setItem("site-token", token)
      localStorage.setItem("user_id", res.profile.user_id)
      localStorage.setItem("name", res.profile.name)
      localStorage.setItem("surname", res.profile.surname)
      localStorage.setItem("email", res.profile.email)
      localStorage.setItem("tel_number", res.profile.tel_number)
      localStorage.setItem("role", res.profile.role)
      setSiteToken(token)
    }
    else {
      message.error(res.msg);
    }
  }

  async function setUpCard() {
    // TODO add login_id
    let prescriptionRecords = await apis.prescriptionCards("some id")

    setData(prescriptionRecords)
  }

  useEffect(() => {
    socket.on("connect", () => { console.log("Connected:", socket.id) });
    socket.on("response", () => { console.log("Response:", socket.id) });
    socket.on("update", () => { 
      console.log("Update");
      setUpCard();
    });

    setSiteToken(localStorage.getItem("site-token"))
  }, [])

  useEffect(() => {
    if (siteToken === null) {
      setSigninState(false)
    }
    else {
      let uid = localStorage.getItem("user_id")
      utilFuncs.validateLogin(uid).then((res) => {
        if (res != false) {
          setSiteToken(res)
        }
        else {
          console.log('res :>> ', res);
          localStorage.clear()
          Router.reload(window.location.pathname)
        }
      })
      setUpCard()
      setSigninState(true)
    }
  }, [siteToken])

  return (
    <div>
      <HeaderMain title="Banphaeo Hospital" />

      <main>
        <NavMain signinState={signinState}/>
        {signinState === null &&
          <LoadingMain/>
        }
        {signinState === true &&
          <div className='container'>
            <NavSide  activeRoute='/' />
            <div className='container-content'>
              <h1>หน้าหลัก</h1>
              <div className={styles.containerData}>
                <div className={styles.containerColumn}>
                  <div className={styles.columnTitle}>
                    ถูกต้อง
                  </div>
                  {
                    data["success"].map(function (d) {
                      return <CardMed key={d["pid"]}
                        prescript_id={d["pid"]}
                        type="success" 
                        queueId={d["queueId"]} 
                        prescriptionId={d["prescriptId"]} 
                        numPart={d["numPart"]} 
                        numAll={d["numAll"]}
                        dt={d["dt"]}
                        />
                    })
                  }
                </div>
                <div className={styles.containerColumn}>
                  <div className={styles.columnTitle}>
                    ผิดพลาด
                  </div>
                  {
                    data["error"].map(function (d) {
                      return <CardMed key={d["pid"]} 
                        prescript_id={d["pid"]}
                        type="error" 
                        queueId={d["queueId"]} 
                        prescriptionId={d["prescriptId"]} 
                        numPart={d["numPart"]} 
                        numAll={d["numAll"]}
                        dt={d["dt"]}
                        />
                    })
                  }
                </div>
                <div className={styles.containerColumn}>
                  <div className={styles.columnTitle}>
                    สูญหาย
                  </div>
                  {
                    data["warning"].map(function (d) {
                      return <CardMed key={d["pid"]} 
                        prescript_id={d["pid"]}
                        type="warning" 
                        queueId={d["queueId"]} 
                        prescriptionId={d["prescriptId"]} 
                        numPart={d["numPart"]} 
                        numAll={d["numAll"]}
                        dt={d["dt"]}
                        />
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        }
        {signinState === false &&
          <div className={styles.signinContainer}>
            <div className={styles.signinContent}>
              <p className={styles.signinTitle}>เข้าสู่ระบบ</p>
              <Input placeholder="อีเมล" onChange={(e) => {setInpEmail(e.target.value)}} />
              <br />
              <Input.Password 
                placeholder="รหัสผ่าน" 
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => {setInpPassword(e.target.value)}}
              />
              <br />
              <Button type="primary" shape="round" size='middle' onClick={clickSignin}>
                เข้าสู่ระบบ
              </Button>
              <Link href="/forgot">
                <Button type="link" size='middle' style={{color:'grey'}}>
                  ลืมรหัสผ่าน
                </Button>
              </Link>
              <Link href="/register">
                <Button type="link" size='middle' style={{color:'black'}}>
                  สมัครสมาชิก
                </Button>
              </Link>
            </div>
          </div>
        }
      </main>

      <FooterMain withSidebar={true}/>
    </div>
  )
}
