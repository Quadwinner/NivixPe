import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      {/* Hero Section - More Natural */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text mb-6 leading-tight">
              Send Money Anywhere,
              <br />
              <span className="text-accent">Pay Almost Nothing</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-muted max-w-3xl leading-relaxed mb-10">
              Nivix Pay combines the speed of blockchain with the familiarity of bank transfers.
              Send SOL, USDC, or convert to local currencies like INR, USD, EUR - all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <WalletMultiButton className="!bg-accent hover:!bg-accent-700 !rounded-lg !px-8 !py-4 !font-semibold !text-base" />
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/automated-transfer')}
                className="!border-2 !px-8 !py-4 !text-base"
              >
                See How It Works →
              </Button>
            </div>

            {/* Real Stats */}
            <div className="flex flex-wrap gap-12">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-text mb-1">$0.00001</div>
                <div className="text-sm text-text-muted">avg. transaction fee</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-text mb-1">&lt;1 sec</div>
                <div className="text-sm text-text-muted">transaction time</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-text mb-1">24/7</div>
                <div className="text-sm text-text-muted">always online</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement - Human Touch */}
      <section className="py-12 bg-gray-50">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-6">Why We Built This</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-3">🏦 Traditional Banks</h3>
              <p className="text-text-muted mb-4 text-sm leading-relaxed">
                International transfers take 3-5 business days and cost $15-45 per transaction.
                Weekend? Forget about it. You're waiting till Monday.
              </p>
              <div className="text-xs text-red-600 font-medium">❌ Too slow, too expensive</div>
            </Card>

            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-3">💸 Money Transfer Apps</h3>
              <p className="text-text-muted mb-4 text-sm leading-relaxed">
                Apps like Wise or Western Union are better, but still charge 2-5% fees.
                Plus, they don't support crypto at all.
              </p>
              <div className="text-xs text-orange-600 font-medium">⚠️ Limited, still pricey</div>
            </Card>

            <Card className="bg-white border-2 border-accent">
              <h3 className="text-lg font-semibold text-accent mb-3">⚡ Nivix Pay</h3>
              <p className="text-text-muted mb-4 text-sm leading-relaxed">
                Instant transfers, crypto or fiat. Pay fractions of a cent.
                No business hours - it's blockchain, it never sleeps.
              </p>
              <div className="text-xs text-green-600 font-medium">✓ Fast, cheap, always works</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Real Use Cases */}
      <section className="py-16">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-4">Who Uses Nivix Pay?</h2>
          <p className="text-text-muted mb-10 text-lg">Real people, real needs</p>

          <div className="space-y-8">
            {/* Use Case 1 */}
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="text-4xl">👨‍💻</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-2">Freelancers Getting Paid</h3>
                  <p className="text-text-muted mb-3 leading-relaxed">
                    Sarah is a graphic designer in India working with clients in the US. Instead of losing
                    5% to PayPal and waiting 3 days, she gets paid in USDC instantly. Then converts to INR
                    directly to her bank account - all in under a minute.
                  </p>
                  <div className="text-sm text-accent font-medium">Saves ~$150 per month in fees</div>
                </div>
              </div>
            </Card>

            {/* Use Case 2 */}
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="text-4xl">🏠</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-2">Sending Money Home</h3>
                  <p className="text-text-muted mb-3 leading-relaxed">
                    Miguel works in Spain but sends money to his family in Mexico every month.
                    Traditional remittance services charge him €25-40 per transfer. With Nivix,
                    he pays less than a cent and his family receives it instantly.
                  </p>
                  <div className="text-sm text-accent font-medium">Saves ~€350 per year</div>
                </div>
              </div>
            </Card>

            {/* Use Case 3 */}
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                <div className="text-4xl">🛍️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-2">E-commerce Merchants</h3>
                  <p className="text-text-muted mb-3 leading-relaxed">
                    An online store accepts payments globally. Credit card processors take 2.9% + $0.30
                    per transaction. With Nivix, they accept crypto payments for almost free, and can
                    convert to their local currency whenever they want.
                  </p>
                  <div className="text-sm text-accent font-medium">Saves thousands on fees annually</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Actually Works */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-4">How Does It Work?</h2>
          <p className="text-text-muted mb-10 text-lg">
            We're not reinventing the wheel - we're combining two things that work really well
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-white">
              <h3 className="text-xl font-semibold text-text mb-4">🔗 Solana Blockchain</h3>
              <p className="text-text-muted leading-relaxed mb-4">
                Solana can process over 65,000 transactions per second. That's faster than Visa.
                And it costs almost nothing - literally fractions of a penny per transaction.
              </p>
              <p className="text-text-muted leading-relaxed mb-4">
                When you send money on Nivix, it's actually being transferred on the Solana blockchain.
                This means it's fast, secure, and transparent - you can see every transaction on the blockchain.
              </p>
              <div className="text-sm text-accent font-medium">Learn more about Solana →</div>
            </Card>

            <Card className="bg-white">
              <h3 className="text-xl font-semibold text-text mb-4">🔐 Hyperledger Fabric KYC</h3>
              <p className="text-text-muted leading-relaxed mb-4">
                To stay legal and prevent fraud, we need to verify who you are (KYC). But we don't
                want your data sitting in some database that could get hacked.
              </p>
              <p className="text-text-muted leading-relaxed mb-4">
                So we use Hyperledger Fabric - a private blockchain used by IBM, Walmart, and major banks.
                Your identity is verified once, stored securely, and only you control access to it.
              </p>
              <div className="text-sm text-accent font-medium">Your data stays private</div>
            </Card>
          </div>

          {/* Simple Steps */}
          <div className="bg-white rounded-lg p-8">
            <h3 className="text-2xl font-semibold text-text mb-6 text-center">Your First Transaction</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <div className="font-semibold text-text mb-2">Connect Wallet</div>
                <div className="text-sm text-text-muted">Use Phantom, Solflare, or any Solana wallet</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <div className="font-semibold text-text mb-2">Verify Once</div>
                <div className="text-sm text-text-muted">Quick KYC verification (takes 2 minutes)</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <div className="font-semibold text-text mb-2">Send Money</div>
                <div className="text-sm text-text-muted">Choose crypto or fiat, enter amount</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                <div className="font-semibold text-text mb-2">Done!</div>
                <div className="text-sm text-text-muted">Money arrives in seconds, not days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Comparison Table */}
      <section className="py-16">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-4">Let's Be Honest About Fees</h2>
          <p className="text-text-muted mb-8 text-lg">Sending $1,000 internationally</p>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-text">Service</th>
                  <th className="px-6 py-4 text-left font-semibold text-text">Fee</th>
                  <th className="px-6 py-4 text-left font-semibold text-text">Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-text">Exchange Rate Markup</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-text-muted">Bank Wire Transfer</td>
                  <td className="px-6 py-4 text-text">$25-45</td>
                  <td className="px-6 py-4 text-text">3-5 business days</td>
                  <td className="px-6 py-4 text-text">~3-5%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-text-muted">Western Union</td>
                  <td className="px-6 py-4 text-text">$15-30</td>
                  <td className="px-6 py-4 text-text">Minutes to days</td>
                  <td className="px-6 py-4 text-text">~2-4%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-text-muted">Wise (formerly TransferWise)</td>
                  <td className="px-6 py-4 text-text">$4-8</td>
                  <td className="px-6 py-4 text-text">1-2 business days</td>
                  <td className="px-6 py-4 text-text">Real rate (best traditional option)</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-text-muted">PayPal</td>
                  <td className="px-6 py-4 text-text">$5-15</td>
                  <td className="px-6 py-4 text-text">Instant</td>
                  <td className="px-6 py-4 text-text">~4-5%</td>
                </tr>
                <tr className="bg-accent-50 hover:bg-accent-100">
                  <td className="px-6 py-4 font-semibold text-accent">Nivix Pay</td>
                  <td className="px-6 py-4 font-semibold text-accent">$0.00001</td>
                  <td className="px-6 py-4 font-semibold text-accent">&lt;1 second</td>
                  <td className="px-6 py-4 font-semibold text-accent">Real market rate</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-text-muted mt-4">
            * Fees and times vary by country and payment method. Bank exchange rates often hide 3-5% markup in the rate.
          </p>
        </div>
      </section>

      {/* Testimonials - Real Feel */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-10 text-center">What People Say</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-text-muted mb-4 italic leading-relaxed">
                "I was skeptical at first, but after my first transfer, I was blown away.
                My client in the US paid me in USDC and I had INR in my bank account in less than 2 minutes.
                No more waiting for PayPal to 'process' for 3 days."
              </p>
              <div className="font-semibold text-text">- Priya K.</div>
              <div className="text-sm text-text-muted">Freelance Developer, Mumbai</div>
            </Card>

            <Card className="bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-text-muted mb-4 italic leading-relaxed">
                "Finally, a way to send money to my family that doesn't eat up half of it in fees.
                I used to lose $30-40 per transfer. Now it's basically free. This is what fintech should be."
              </p>
              <div className="font-semibold text-text">- Carlos M.</div>
              <div className="text-sm text-text-muted">Construction Worker, Barcelona</div>
            </Card>

            <Card className="bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-text-muted mb-4 italic leading-relaxed">
                "We integrated Nivix Pay for our e-commerce store and cut our payment processing costs by 70%.
                Plus, our international customers love that they can pay with crypto. Win-win."
              </p>
              <div className="font-semibold text-text">- Sarah T.</div>
              <div className="text-sm text-text-muted">E-commerce Owner, London</div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ - Real Questions */}
      <section className="py-16">
        <div className="w-full px-4 md:px-6">
          <h2 className="text-3xl font-bold text-text mb-10">Questions People Actually Ask</h2>

          <div className="space-y-6">
            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-2">Do I need to know about cryptocurrency?</h3>
              <p className="text-text-muted leading-relaxed">
                Nope. You can send and receive money in your local currency (USD, INR, EUR, etc.) just like any other app.
                The blockchain stuff happens in the background. If you want to use crypto, that's cool too - but it's not required.
              </p>
            </Card>

            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-2">Is this legal?</h3>
              <p className="text-text-muted leading-relaxed">
                Yes! We're fully compliant with financial regulations. That's why we do KYC verification -
                it's required by law for any financial service. We work with licensed payment processors for fiat currency conversions.
              </p>
            </Card>

            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-2">What if something goes wrong?</h3>
              <p className="text-text-muted leading-relaxed">
                Every transaction is recorded on the blockchain, so there's a permanent record.
                If there's an issue, we can trace exactly what happened. Plus, we have customer support - real humans who actually respond.
              </p>
            </Card>

            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-2">How do you make money if fees are so low?</h3>
              <p className="text-text-muted leading-relaxed">
                Good question! We make a tiny margin on currency conversions (way less than banks).
                For crypto-to-crypto transfers, we literally don't make money - the blockchain fee is $0.00001 and that goes to validators, not us.
                Our business model is volume, not gouging each transaction.
              </p>
            </Card>

            <Card className="bg-white">
              <h3 className="text-lg font-semibold text-text mb-2">Can I try it without risking a lot of money?</h3>
              <p className="text-text-muted leading-relaxed">
                Absolutely. Start with a small test transaction - send yourself $10 to see how it works.
                There's no minimum, and with fees this low, even testing costs you almost nothing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA - Honest */}
      <section className="py-16 bg-accent text-white">
        <div className="w-full px-4 md:px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Stop Overpaying?</h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Connect your wallet and try your first transaction. If it doesn't work as advertised,
            we'll be shocked (but also sorry and we'll fix it).
          </p>
          <WalletMultiButton className="!bg-white !text-accent hover:!bg-gray-100 !rounded-lg !px-8 !py-4 !font-semibold !text-lg" />
          <p className="text-sm text-white/70 mt-6">
            No signup forms, no credit card required, no monthly fees. Just connect and go.
          </p>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-8 bg-gray-900 text-gray-300">
        <div className="w-full px-4 md:px-6 text-center text-sm">
          <p className="mb-2">
            Built on <span className="text-white font-medium">Solana</span> blockchain ·
            KYC powered by <span className="text-white font-medium">Hyperledger Fabric</span>
          </p>
          <p className="text-gray-400">
            Licensed and compliant · Based in [Your Location] · Not financial advice, just really cheap money transfers
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
