import { Text } from '@chakra-ui/react'

import { Container } from '../components/Container'
import { CTA } from '../components/CTA'
import { Footer } from '../components/Footer'
import NavBar from '../components/NavBar/NavBar'

const Index = () => (
    <>
        <NavBar/>
        <Container height="100vh">
            <Footer>
                <Text>Next ❤️ Chakra</Text>
            </Footer>
            <CTA/>
        </Container>
    </>
)

export default Index
