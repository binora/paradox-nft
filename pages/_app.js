import 'semantic-ui-css/semantic.min.css'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../common/theme';


export default function MyApp({ Component, pageProps }) {
    return (
        <ChakraProvider theme={theme}>
            <Component {...pageProps} />
        </ChakraProvider>

    )
}