import { Fragment } from "react";
import { MouseEvent } from "react";
import { useState } from "react";

function Listgroup() {
  //let is used for variables that can change, const for variables that won't change
  let items = [
    "An item",
    "A second item",
    "A third item",
    "A fourth item",
    "And a fifth one",
  ];
  //let selectedIndex = 0 ;
  //event handler
  //const handleClick = (event: MouseEvent) => console.log(event);

  const [selectedIndex, setSelectedIndex] = useState(-1);

  return (
    //we use fragment to avoid extra divs and to group multiple elements or use only<>
    <Fragment>
      //{items.length === 0 ? <h1>No items found</h1> : null}
      {items.length === 0 && <h1>No items found</h1>}
      <h1>List</h1>
      <ul className="list-group">
        {items.map((item, index) => (
          // in real apps use unique ids from api as key not item index or name
          <li
            key={item}
            className="list-group-class"
            // onClick={() => console.log(item)}
            onClick={() => {
              setSelectedIndex(index);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </Fragment>
  );
}

export default Listgroup;
