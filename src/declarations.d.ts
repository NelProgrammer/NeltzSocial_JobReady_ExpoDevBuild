// Global module declarations to silence missing type errors for JS modules and untyped libraries
declare module '../components/References' {
  const References: any;
  export default References;
}

declare module '../context/AuthContext' {
  import React from 'react';
  export const AuthContext: React.Context<any>;
}

declare module '../context/ResumeContext' {
  import React from 'react';
  export const ResumeContext: React.Context<any>;
}

declare module '@expo/vector-icons' {
  export const MaterialCommunityIcons: any;
  export const MaterialIcons: any;
  const icons: any;
  export default icons;
}

// Catch‑all module declaration for any other JS modules
declare module '*';
