import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<menu name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

				<ScrollViewStyleReset />
				<style dangerouslySetInnerHTML={{ __html: responiveBackground }} />
			</head>

			<body>{children}</body>
		</html>
	);
}

const responiveBackground = `
body {
    background-color: #FFFFFF;
}
    
@media (prefers-color-scheme: dark) {
    body {
        background-color: #000000;
    }
} 
`;
