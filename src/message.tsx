function Message(){
//jsx compiled in js not html
const name = 'rashad'
//normal if
if(name)
//{variable} to use variable or dynamic content
    return <h1>Hello {name}</h1>;
    return <h1>Hello unknown</h1>;
}
//export as default object
export default Message;