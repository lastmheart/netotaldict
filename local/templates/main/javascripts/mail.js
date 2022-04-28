function showMail (p1, p2, p3, style, txt) {
	var wp2 = (p2) ? p2 : "totaldict"; 
	var wp3 = "." + ((p3) ? p3 : "ru"); 
	var addr = p1 + "@" + wp2 + wp3;
	var wtxt = (txt) ? txt : addr; 
	var wstyle = (style) ? style : ""; 
	document.write("<a h" + "ref" + "=\"ma" + "ilt" + "" + "o:" + addr + "\" " + wstyle + " >" + wtxt + "</a>");
}