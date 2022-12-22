import { Button, Col, Collapse, Modal, Row } from "antd";
import { useCallback, useEffect, useRef, useState } from "react"
import styles from '../styles/card.module.css';
import Barcode from 'react-barcode';
import { useReactToPrint } from "react-to-print";
import apis from "../manager/apis";

export default function CardMed(params) {
  const [mode, setMode] = useState("summary")
  const [txtBtnMode, setTxtBtnMode] = useState("ดูประวัติ")
  const [color, setColor] = useState()
  const [queueId, setQueueId] = useState('9999')
  const [prescriptionId, setPrescriptionId] = useState('1234567890')
  const [numPart, setNumPart] = useState(5)
  const [numAll, setNumAll] = useState(9)
  const [dt, setDt] = useState('31/12/2022 23:59:59')
  const [cardDetails, setCardDetails] = useState({
    hn: "HN1234567890",
    patient_name: "ชื่อดี นามสกุลงาม",
    age: "24",
    doctor: "นพ.กอไก่ รักเรียน",
    hospital_unit: "ห้องตรวจ Echo",
    call: 9,
    ctrue: 3,
    cerror: 4,
    cwarning: 2,
    med_rec: [
      {
        "submit_date": "31/12/2022 23:59:59",
        "ctrue": 5,
        "cfalse": 1,
        "cnull": 4,
        "list": [
          {
            'key': '1',
            'med_name': 'perspiciatis',
            'dose': 20,
            'status': false
          },
          {
            'key': '2',
            'med_name': 'facis',
            'dose': 5,
            'status': null
          },
          {
            'key': '3',
            'med_name': 'paracetamon',
            'dose': 40,
            'status': true
          }
        ]
      },
      {
        "submit_date": "31/12/2022 23:55:00",
        "ctrue": 1,
        "cfalse": 2,
        "cnull": 3,
        "list": [
          {
            'key': '1',
            'med_name': 'perspiciatis',
            'dose': 20,
            'status': false
          },
          {
            'key': '2',
            'med_name': 'facis',
            'dose': 5,
            'status': false
          },
          {
            'key': '3',
            'med_name': 'paracetamon',
            'dose': 40,
            'status': true
          }
        ]
      }
    ]
  })
  const [activeKey, setActiveKey] = useState([])
  const [isBtnMoreLoading, setIsBtnMoreLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { Panel } = Collapse;

  const printRef = useRef(null)
  const reactToPrintContent = useCallback(() => {
    return printRef.current
  }, [printRef])
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "ใบสั่งยา",
    removeAfterPrint: true
  })

  function clickMore() {
    setIsBtnMoreLoading(true)
    apis.prescriptionDetails(params.prescript_id).then((res) => {
      if (res !== null) {
        setCardDetails((prev) => ({
          ...res
        }))
      }
    })
    setIsBtnMoreLoading(false)
    setIsModalOpen(true)
  }

  function clickLog() {
    if (mode == "summary") {
      setMode("details")
      setTxtBtnMode("ดูสรุป") 
    }
    else {
      setMode("summary")
      setTxtBtnMode("ดูประวัติ")
    }
    // setIsModalOpen(false)
  }

  function clickCancel() {
    setIsModalOpen(false)
  }

  function clickOk() {
    setIsModalOpen(false)
  }

  useEffect(() => {
    console.log('params :>> ', params);
    switch (params.type) {
      case 'success':
        setColor('#778472')
        break;
      
      case 'error':
        setColor('#C06E52')
        break;
      
      case 'warning':
        setColor('#F2A541')
        break;

      default:
        setColor('#999999')
        break;
    }

    if (params.queueId !== undefined) {
      setQueueId(params.queueId)
    }
    if (params.prescriptionId !== undefined) {
      setPrescriptionId(params.prescriptionId)
    }
    if (params.numPart !== undefined) {
      setNumPart(params.numPart)
    }
    if (params.numAll !== undefined) {
      setNumAll(params.numAll)
    }
    if (params.dt !== undefined) {
      setDt(params.dt)
    }
  }, [params])

  useEffect(() => {
  }, [cardDetails])

  return (
    <div className={styles.card}>
      <div className={styles.cardTop} style={{'backgroundColor':color}}>
        <p className={styles.textQueue}>คิวที่ {queueId}</p>
        <p>หมายเลขใบสั่งยา</p>
        <p>#{prescriptionId}</p>
      </div>
      <div className={styles.cardBottom}>
        <p className={styles.textNum}>{numPart}&nbsp;&nbsp;/&nbsp;&nbsp;{numAll}</p>
        <p className={styles.textDt}>{dt}</p>
        <Button className={styles.textMore} type="link" onClick={clickMore} loading={isBtnMoreLoading}>กดเพื่อดูรายละเอียด</Button>
        <Modal open={isModalOpen} 
          onCancel={clickCancel} 
          onOk={clickOk} 
          footer={[
            <Button key="log" onClick={clickLog}>
              ดูประวัติ
            </Button>,
            <Button key="print" type="primary"onClick={handlePrint}>
              พิมพ์
            </Button>
          ]}>
          <div ref={printRef} className={styles.containerModal}>
            <div className={styles.modalTitle}>
              <span>หมายเลขใบสั่งยา</span>
              <span>#{prescriptionId}</span>
            </div>
            <Row>
              <Col span={12}>
                <Row><u>HN</u>&nbsp;&nbsp;{cardDetails.hn}</Row>
                <Row><u>ชื่อ</u>&nbsp;&nbsp;{cardDetails.patient_name}</Row>
                <Row><u>อายุ</u>&nbsp;&nbsp;{cardDetails.age} ปี</Row>
              </Col>
              <Col span={12}>
                <Barcode {...{'width':1,'height':50, 'displayValue':false}} value={cardDetails.hn} />
              </Col>
            </Row>
            {mode === "summary" &&
              <div style={{'marginTop':'24px'}}>
                <div className={styles.modalNum}>
                  <div className={styles.modalNumPart} style={{'backgroundColor':'#778472'}}>
                    <span>ถูกต้อง</span>
                    <span className={styles.textNum}>{cardDetails.ctrue}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                  </div>
                  <div className={styles.modalNumPart} style={{'backgroundColor':'#C06E52'}}>
                    <span>ผิดพลาด</span>
                    <span className={styles.textNum}>{cardDetails.cerror}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                  </div>
                  <div className={styles.modalNumPart} style={{'backgroundColor':'#F2A541'}}>
                    <span>สูญหาย</span>
                    <span className={styles.textNum}>{cardDetails.cwarning}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                  </div>
                </div>
                <div style={{'marginTop':'24px','marginBottom':'12px'}}>
                  <Row>
                    <Col span={3}>ลำดับ</Col>
                    <Col span={14}>รายการ</Col>
                    <Col span={3}>จำนวน</Col>
                    <Col span={3}>สถานะ</Col>
                  </Row>
                  {cardDetails.med_rec[cardDetails.med_rec.length-1]["list"].map((med, ind) => (
                    <Row key={med["key"]}>
                      <Col span={3}>{ind+1}</Col>
                      <Col span={14}>{med["med_name"]}</Col>
                      <Col span={3}>{med["dose"]}</Col>
                      {med["status"] == true && <Col span={3} className={styles.medStatusTrue}></Col>}
                      {med["status"] == false && <Col span={3} className={styles.medStatusFalse}></Col>}
                      {med["status"] == null && <Col span={3} className={styles.medStatusNull}></Col>}
                    </Row>
                  ))}
                </div>
              </div>
            }
            {mode === "details" &&
              <Collapse defaultActiveKey={activeKey}>
                {cardDetails.med_rec.map(function (o) {
                  return <Panel header={"เวลาตรวจสอบ : "+o['submit_date']} key={o['submit_date']}><div style={{'marginTop':'24px'}}>
                    <div className={styles.modalNum}>
                      <div className={styles.modalNumPart} style={{'backgroundColor':'#778472'}}>
                        <span>ถูกต้อง</span>
                        <span className={styles.textNum}>{o['ctrue']}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                      </div>
                      <div className={styles.modalNumPart} style={{'backgroundColor':'#C06E52'}}>
                        <span>ผิดพลาด</span>
                        <span className={styles.textNum}>{o['cfalse']}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                      </div>
                      <div className={styles.modalNumPart} style={{'backgroundColor':'#F2A541'}}>
                        <span>สูญหาย</span>
                        <span className={styles.textNum}>{o['cnull']}&nbsp;&nbsp;/&nbsp;&nbsp;{cardDetails.call}</span>
                      </div>
                    </div>
                    <div style={{'marginTop':'24px','marginBottom':'12px'}}>
                      <Row>
                        <Col span={3}>ลำดับ</Col>
                        <Col span={14}>รายการ</Col>
                        <Col span={3}>จำนวน</Col>
                        <Col span={3}>สถานะ</Col>
                      </Row>
                      {o["list"].map((med, ind) => (
                        <Row key={med["key"]}>
                          <Col span={3}>{ind+1}</Col>
                          <Col span={14}>{med["med_name"]}</Col>
                          <Col span={3}>{med["dose"]}</Col>
                          {med["status"] == true && <Col span={3} className={styles.medStatusTrue}></Col>}
                          {med["status"] == false && <Col span={3} className={styles.medStatusFalse}></Col>}
                          {med["status"] == null && <Col span={3} className={styles.medStatusNull}></Col>}
                        </Row>
                      ))}
                    </div>
                  </div></Panel>
                })}
              </Collapse>
            }
            <div className={styles.modalFooter}>
              <span>แพทย์:&nbsp;&nbsp;{cardDetails.doctor}</span>
              <div className={styles.modalFooterDetails}>
                <div className={styles.textDt}>พิมพ์ที่&nbsp;&nbsp;{cardDetails.hospital_unit}</div>
                <div className={styles.textDt}>{dt}</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
};
