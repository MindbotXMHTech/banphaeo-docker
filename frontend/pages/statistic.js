import styles from '../styles/statistic.module.css';
import { useCallback, useEffect, useState, useRef } from 'react';
import { PrinterOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { Button, DatePicker, Select, Table, Col, Collapse, Modal, Row } from 'antd';
import { useRouter } from 'next/router';
import csvDownload from 'json-to-csv-export'
import FooterMain from '../components/footer_main';
import NavMain from '../components/nav_main';
import NavSide from '../components/nav_side';
import LoadingMain from '../components/loading_main';
import HeaderMain from '../components/header_main';
import moment from 'moment';
import Barcode from 'react-barcode';
import { useReactToPrint } from "react-to-print";
import apis from '../manager/apis';

const dateFormat = "DD/MM/YYYY"

export default function Stat() {
  const [signinState, setSigninState] = useState(null);
  const [siteToken, setSiteToken] = useState();
  const [selectedDate, setSelectedDate] = useState([null, null])
  const [optionFilter, setOptionFilter] = useState([])
  const [mode, setMode] = useState("summary")
  const [txtBtnMode, setTxtBtnMode] = useState("ดูประวัติ")
  const [summary, setSummary] = useState({
    "success": 0,
    "warning": 0,
    "error": 0
  })
  const [chartData, setChartData] = useState([
    {
      type: 'ถูกต้อง',
      value: 0,
    },
    {
      type: 'ผิดพลาด',
      value: 0,
    },
    {
      type: 'สูญหาย',
      value: 0,
    },
  ]);
  const [tableData, setTableData] = useState([])

  const [cardDetails, setCardDetails] = useState({
    waiting_queue: "99",
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const { Panel } = Collapse;
  const { RangePicker } = DatePicker;
  const chartConfig = {
    autofit: true,
    appendPadding: 10,
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    color: ({ type }) => {
      if(type === 'ถูกต้อง'){
        return '#778472';
      }
      else if(type === 'ผิดพลาด'){
        return '#C06E52';
      }
      else if(type === 'สูญหาย'){
        return '#F2A541';
      }
      return 'grey';
    },
    radius: 1,
    innerRadius: 0.6,
    legend: false,
    label: {
      type: 'outer',
      offset: '-50%',
      content: '{value}',
      style: {
        textAlign: 'center',
        fontSize: 14,
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    statistic: {
      title: true,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: 'ใบสั่งยา ' + tableData.length + ' ใบ',
      },
    }
  };

  const printRef = useRef(null)
  const reactToPrintContent = useCallback(() => {
    return printRef.current
  }, [printRef])
  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "ใบสั่งยา",
    removeAfterPrint: true
  })

  async function clickView(e) {
    apis.prescriptionDetails(siteToken, e.prescript_id).then((res) => {
      if (res !== null) {
        setCardDetails(() => ({
          ...res
        }))
      }
    })
    setIsModalOpen(true)
  }

  async function changeRange(e) {
    if (e != null) {
      setSelectedDate(e)
    }
    else {
      setSelectedDate([null, null])
    }
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
  
  const tableColumns = [
    {
      title: 'หมายเลขใบสั่งยา',
      dataIndex: 'prescript_no',
      width: 150,
      sorter: (a,b) => (a.prescript_no > b.prescript_no) ? 1 : ((b.prescript_no > a.prescript_no) ? -1 : 0)
    },
    {
      title: 'ชื่อผู้ป่วย',
      dataIndex: 'patient_name',
      sorter: (a,b) => (a.patient_name > b.patient_name) ? 1 : ((b.patient_name > a.patient_name) ? -1 : 0)
    },
    {
      title: 'วันที่',
      dataIndex: 'submit_date',
      width: 150,
      sorter: (a,b) => (a.submit_date > b.submit_date) ? 1 : ((b.submit_date > a.submit_date) ? -1 : 0)
    },
    {
      title: 'ตัวเลือก',
      dataIndex: 'hospital_unit',
      width: 150,
      filters: optionFilter,
      onFilter: (value, record) => record.hospital_unit.indexOf(value) === 0,
    },
    {
      title: 'ความถูกต้อง',
      dataIndex: 'num',
      width: 150,
      sorter: (a,b) => (a.num > b.num) ? 1 : ((b.num > a.num) ? -1 : 0)
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      width: 100,
      sorter: (a,b) => (a.status > b.status) ? 1 : ((b.status > a.status) ? -1 : 0)
    },
    {
      title: '',
      dataIndex: '',
      key: 'x',
      width: 100,
      render: (_, record) => <Button onClick={() => clickView(record)}>View</Button>,
    }
  ];

  useEffect(() => {
    setSiteToken(localStorage.getItem("site-token"))
  }, [])

  useEffect(() => {
    if (siteToken === null) {
      setSigninState(false)
      router.push('/')
    }
    else {
      apis.me(siteToken).then((res) => {
        if (!res.success && signinState) {
          localStorage.clear()
          router.push('/')
          setSigninState(false)
        }
        else {
          let endDate = moment()
          let startDate = moment(endDate).subtract(30, "days")
          setSelectedDate([startDate, endDate])
          setSigninState(true)
        }
      })
    }
  }, [siteToken, router])

  useEffect(() => {
    if (selectedDate[0] != null && selectedDate[1] != null) {
      console.log('selectedDate :>> ', selectedDate);
      apis.statistic(siteToken, selectedDate[0], selectedDate[1]).then((res) => {
        setOptionFilter(res.options)
        setSummary(res.summary)
        setChartData(res.chart)
        setTableData(res.table)
      })
    }
  }, [selectedDate])

  return (
    <div>
      <HeaderMain title="Banphaeo Hospital : ข้อมูลสถิติ" />

      <main>
        <NavMain token={siteToken} signinState={signinState} />
        {signinState === null &&
          <LoadingMain/>
        }
        {signinState === true &&
          <div className='container'>
            <NavSide  activeRoute='/statistic' />
            <div className='container-content'>
              <h1>สถิติ</h1>
              <div className={styles.containerCard}>
                <div className={styles.chartArea}>
                  {/* Left - Pie chart */}
                  <Pie {...chartConfig} className={styles.chart}/>
                  <div className={styles.vtLine}></div>
                  {/* Right - Select date */}
                  <div className={styles.sideData}>
                    <div className={styles.btnExport}>
                      <Button type='primary' icon={<PrinterOutlined />} onClick={() => {csvDownload({data:tableData,filename:`ข้อมูลใบสั่งยา - ${new Date()}`,delimiter:',',headers: ['prescript_id',"prescript_no","waiting_queue","patient_name","hospital_unit","submit_date","login_id","status","num","numPart","numAll"]})}}>ส่งออกข้อมูล</Button>
                    </div>
                    <div className={styles.datePicker}>
                      <RangePicker className={styles.datePickerRange} format={dateFormat} onChange={changeRange} value={selectedDate} />
                    </div>
                    <p>จำนวนใบสั่งยา</p>
                    <div className={styles.statData}>
                      <div style={{'backgroundColor':'#778472','width':'20px','height':'20px'}}></div>
                      <span style={{'paddingLeft':'10px', 'flex':1}}>ถูกต้อง</span>
                      <span style={{'alignSelf':'flex-end'}}>{summary.success}%</span>
                    </div>
                    <div className={styles.statData}>
                      <div style={{'backgroundColor':'#C06E52','width':'20px','height':'20px'}}></div>
                      <span style={{'paddingLeft':'10px', 'flex':1}}>ผิดพลาด</span>
                      <span style={{'alignSelf':'flex-end'}}>{summary.error}%</span>
                    </div>
                    <div className={styles.statData}>
                      <div style={{'backgroundColor':'#F2A541','width':'20px','height':'20px'}}></div>
                      <span style={{'paddingLeft':'10px', 'flex':1}}>สูญหาย</span>
                      <span style={{'alignSelf':'flex-end'}}>{summary.warning}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Table columns={tableColumns} dataSource={tableData} rowKey="submit_date" style={{margin: "20px"}} />
                <Modal open={isModalOpen} 
                  onCancel={clickCancel} 
                  onOk={clickOk} 
                  footer={[
                    <Button key="log" onClick={clickLog}>
                      {txtBtnMode}
                    </Button>,
                    <Button key="print" type="primary"onClick={handlePrint}>
                      พิมพ์
                    </Button>
                  ]}>
                  <div ref={printRef} className={styles.containerModal}>
                    <div className={styles.modalTitle}>
                      <span>หมายเลขใบสั่งยา</span>
                      <span>#{cardDetails.prescript_no}</span>
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
                      <Collapse defaultActiveKey={[]}>
                        {cardDetails.med_rec.map(function (o) {
                          return <Panel header={"เวลาตรวจสอบ : "+o['submit_date']} key={o['submit_date'].toString()+o['list'].length}><div style={{'marginTop':'24px'}}>
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
                        <div className={styles.textDt}>{cardDetails.submit_date}</div>
                      </div>
                    </div>
                  </div>
                </Modal>
              </div>
            </div>
          </div>
        }
      </main>

      <FooterMain withSidebar={true}/>
    </div>
  )
}
