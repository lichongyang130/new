import React from 'react';

export function Card({children}:{children:React.ReactNode}){
 return <section className="wb-card">{children}</section>
}

export function Avatar({text='AI'}:{text?:string}){
 return <div className="wb-avatar">{text}</div>
}

export function Tag({children}:{children:React.ReactNode}){
 return <span className="wb-tag">{children}</span>
}

export function Button({children}:{children:React.ReactNode}){
 return <button className="wb-button">{children}</button>
}

export const WorkbenchStyle=()=> <style>{`
.wb-card{border:1px solid #eee;border-radius:18px;padding:18px;background:#fff}
.wb-avatar{width:46px;height:46px;border-radius:50%;background:#f1f1f1;display:flex;align-items:center;justify-content:center}
.wb-tag{background:#f5f5f5;padding:4px 10px;border-radius:12px;font-size:12px;margin-right:6px}
.wb-button{border:1px solid #ddd;border-radius:12px;background:#fff;padding:10px 18px;cursor:pointer}
`}</style>
