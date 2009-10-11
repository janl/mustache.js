var a = function(s) {
    return s.replace(/[&"\<>]/g, function(s) {
      switch(s) {
        case "&": return "&amp;"; break;
        case "\\": return "\\\\"; break;
        case '"': return '\"'; break;
        case "<": return "&lt;"; break;
        case ">": return "&gt;"; break;
        default: return String(s); break;
      }
    });
  };

print(a("as&<"));