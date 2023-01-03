import Link from 'next/link' 
import { AppstoreOutlined, LineChartOutlined, UserAddOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';


export default function NavSide(props) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, [])

  return (
    <div className='nav-side'>
      {props.activeRoute === '/' &&
        <Link href="/">
          <AppstoreOutlined className='nav-side-item' style={{'color':'white', 'fontSize':'32px'}} />
        </Link>
      }
      {props.activeRoute !== '/' &&
        <Link href="/">
          <AppstoreOutlined className='nav-side-item' />
        </Link>
      }
      {(props.activeRoute === '/statistic' && role !== 'staff') &&
        <Link href="/statistic">
          <LineChartOutlined className='nav-side-item' style={{'color':'white', 'fontSize':'32px'}} />
        </Link>
      }
      {(props.activeRoute !== '/statistic' && role !== 'staff') &&
        <Link href="/statistic">
          <LineChartOutlined className='nav-side-item' />
        </Link>
      }
      {(props.activeRoute === '/accounts' && role === 'admin') &&
        <Link href="/accounts">
          <UserAddOutlined className='nav-side-item' style={{'color':'white', 'fontSize':'32px'}} />
        </Link>
      }
      {(props.activeRoute !== '/accounts' && role === 'admin') &&
        <Link href="/accounts">
          <UserAddOutlined className='nav-side-item' />
        </Link>
      }
    </div>
  )
}
