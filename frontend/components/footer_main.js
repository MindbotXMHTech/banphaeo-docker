import { useEffect, useState } from "react";

export default function FooterMain(props) {
  const [footerStyle, setFooterStyle] = useState(null)
  const coppyrightYear = new Date().getFullYear();

  useEffect(() => {
    if (props.withSidebar === true) {
      setFooterStyle({
        'backgroundColor': '#224B7B',
        'color': '#eaeaea'
      })
    }
  }, [])

  return (
    <footer className='footer' style={footerStyle}>
      Copyright © {coppyrightYear} MHTech All rights reserved.
    </footer>
  )
}
