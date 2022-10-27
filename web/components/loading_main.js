import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

export default function LoadingMain() {
  return (
    <div className='container-center'>
      <Spin tip="กำลังดาวน์โหลด..." />
    </div>
  )
}
