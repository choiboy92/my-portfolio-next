// app/projects/engdes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const description = "Multiple engineering design projects spanning satellite deployment systems, underwater vehicles, and electric racing cars"
const tags = ["Engineering Design", "CAD", "Manufacturing", "Team Leadership", "Testing"]

export default function EngDesPage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const projects = [
    {
      id: 'metalpod',
      title: 'SATELLITE DEPLOYER',
      role: 'Project Manager',
      description: 'Design, make and test a CubeSat deployment system. The system should interface with the Falcon 9 rocket, protect the satellite during launch, then be able to quickly and effectively deploy a 3U CubeSat.',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      id: 'torpedo',
      title: 'UNDERWATER SCOOTER',
      role: 'Project Manager', 
      description: 'As a team, design an electric powered underwater scooter, capable of depths of 40m and an underwater velocity of 1.5m/s all within a working week.',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'teargear',
      title: 'MINI ELECTRIC DRAG RACER',
      role: 'CAD Manager',
      description: 'Design and manufacture a mini electric drag race car to be raced with other teams. The motor, battery and wheels cannot be altered.',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSections(prev => {
        const allSections = ['intro', 'projects']
        if (prev.length < allSections.length) {
          return [...prev, allSections[prev.length]]
        }
        clearInterval(timer)
        return prev
      })
    }, 300)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <ProjectIntro
        name="Engineering Design Projects"
        date="2018-21"
        id="engdes"
        description={description}
        tags={tags}
      />
      
      <SideQuickNav/>

      {/* Projects Tabs */}
      <div className={`px-4 lg:px-[10%] py-8 transition-all duration-1000 ${
        visibleSections.includes('projects') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <Tabs defaultValue="metalpod" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 mb-8">
            {projects.map(project => (
              <TabsTrigger 
                key={project.id}
                value={project.id} 
                className="data-[state=active]:bg-green-400 data-[state=active]:text-black text-white"
              >
                {project.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Satellite Deployer */}
          <TabsContent value="metalpod" className="space-y-12">
            {/* Project Header */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{projects[0].description}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
                <CardHeader>
                  <CardTitle className="text-white">My Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-400 font-semibold">{projects[0].role}</p>
                </CardContent>
              </Card>
            </div>

            {/* Research & Review */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">🔬</span>
                  Research & Review
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 border-0" />
              </div>
              
              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-gray-300 leading-relaxed">
                  When given a design project, experience has helped me learn that although it is easy to run into the design process headfirst, 
                  this almost always elongates the design period and leads to more time spent redesigning afterwards.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-gray-900/50 border-gray-700 text-center">
                    <CardContent className="p-6">
                      <div className="text-4xl mb-4">🛡️</div>
                      <h4 className="text-white font-semibold mb-2">PROTECTION</h4>
                      <p className="text-gray-300 text-sm">Safeguard satellite during launch conditions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/50 border-gray-700 text-center">
                    <CardContent className="p-6">
                      <div className="text-4xl mb-4">🚀</div>
                      <h4 className="text-white font-semibold mb-2">DEPLOYMENT</h4>
                      <p className="text-gray-300 text-sm">Reliable satellite release mechanism</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900/50 border-gray-700 text-center">
                    <CardContent className="p-6">
                      <div className="text-4xl mb-4">🧱</div>
                      <h4 className="text-white font-semibold mb-2">INTERFACE</h4>
                      <p className="text-gray-300 text-sm">Secure connection to rocket systems</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Concept Sketches */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">✏️</span>
                  Concept Sketches
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 border-0" />
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
                  Leading on from our research, the team and I looked to develop some concept sketches exploring various actuation methods, 
                  deployment methods, shapes & forms, and damping methods.
                </p>
                <div className="relative">
                  <Image 
                    src="/assets/engdes/metalpod_concepts.png" 
                    alt="Metalpod concept sketches"
                    width={1200}
                    height={800}
                    className="w-full rounded-xl shadow-2xl border border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Design Features */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">⚙️</span>
                  Design Features
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 border-0" />
              </div>
              
              <div className="text-center mb-8">
                <Image 
                  src="/assets/engdes/metalpod_exploded.png" 
                  alt="Exploded view of Metalpod"
                  width={800}
                  height={600}
                  className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl border border-gray-700"
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Protection by Damping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/SDOF_model_sketch.jpg" 
                      alt="SDOF model sketch"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Simple SDOF models were used to evaluate vibration transfer. Neoprene rubber sheets reduce natural frequencies to 25-30Hz with significant attenuation.
                    </p>
                    <Image 
                      src="/assets/engdes/SDOF_model_GEVS.png" 
                      alt="SDOF GEVS prediction"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Secure Interface</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/railings.jpg" 
                      alt="Railings design"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      PTFE coated railings provide constraint and smooth interface, allowing satellite to slide out while preventing cold-welding.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Deployment Mechanism</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/burnwire.gif" 
                      alt="Burnwire mechanism sketch"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Burn-wire device provides simple, reliable spring-loaded actuation. Works in zero-gravity with contingency options.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Image 
                  src="/assets/engdes/deployment.gif" 
                  alt="Deployment mechanism animation"
                  width={600}
                  height={400}
                  className="mx-auto rounded-xl shadow-lg border border-gray-700"
                />
              </div>
            </div>

            {/* Testing & Analysis */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">🧪</span>
                  Testing & Analysis
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 border-0" />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Burnwire Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/burnwire.jpg" 
                      alt="Burnwire test setup"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Tested to evaluate required voltages to achieve cutting time below 10s for reliable deployment.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Separation Velocity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/SepVel_testing_setup.jpg" 
                      alt="Separation velocity test setup"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Pulley test simulated low gravity environment to estimate real separation velocity and catch railing interference.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4">Vibration Testing</h4>
                  <p className="text-gray-300 mb-4">
                    Both sine sweeps and random vibration tests were carried out on a shaker table to assess the deployment system&apos;s ability 
                    to protect the satellite under launch conditions and evaluate the accuracy of our SDOF model.
                  </p>
                  <Image 
                    src="/assets/engdes/metalpod_vibration.png" 
                    alt="Vibration test results"
                    width={400}
                    height={300}
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="flex justify-center items-center">
                  <Image 
                    src="/assets/engdes/shakertable.jpg" 
                    alt="Shaker table setup"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg border border-gray-700"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Underwater Scooter */}
          <TabsContent value="torpedo" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{projects[1].description}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/50">
                <CardHeader>
                  <CardTitle className="text-white">My Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-cyan-400 font-semibold">{projects[1].role}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">🏊</span>
                  Design Features
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 border-0" />
              </div>

              <div className="text-center mb-8">
                <Image 
                  src="/assets/engdes/ME2_DesignWeek_render2.jpg" 
                  alt="Torpedo underwater scooter render"
                  width={1000}
                  height={600}
                  className="w-full rounded-xl shadow-2xl border border-gray-700"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-900/50 border-gray-700 text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">👤</div>
                    <h4 className="text-white font-semibold mb-2">User Oriented Design</h4>
                    <p className="text-gray-300 text-sm">Neutral buoyancy for divers with dead man&apos;s switch for safety. Can secure extra weights for deep diving.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 border-gray-700 text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">🏭</div>
                    <h4 className="text-white font-semibold mb-2">Simple Manufacturing</h4>
                    <p className="text-gray-300 text-sm">Injection moulded design using Epoxy SMC with simple waterproofing features.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 border-gray-700 text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">⚡</div>
                    <h4 className="text-white font-semibold mb-2">Effective Actuation</h4>
                    <p className="text-gray-300 text-sm">Motor selection provides 1.5m/s propulsion speed with up to 2 hours of usage.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Image 
                  src="/assets/engdes/torpedo_poster.png" 
                  alt="Technical poster for torpedo project"
                  width={600}
                  height={800}
                  className="mx-auto rounded-xl shadow-lg border border-gray-700"
                />
              </div>
            </div>
          </TabsContent>

          {/* Mini Electric Drag Racer */}
          <TabsContent value="teargear" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{projects[2].description}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/50">
                <CardHeader>
                  <CardTitle className="text-white">My Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-400 font-semibold">{projects[2].role}</p>
                </CardContent>
              </Card>
            </div>

            {/* Concept Sketches */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">📐</span>
                  Concept Sketches
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 border-0" />
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Image 
                    src="/assets/engdes/teargear_concept.png" 
                    alt="Teargear concept sketch"
                    width={400}
                    height={300}
                    className="w-full rounded-lg shadow-lg border border-gray-700"
                  />
                </div>
                <div>
                  <p className="text-gray-300 leading-relaxed">
                    Concept ideation was carried out taking into account restrictions in size and part usage. 
                    However, we looked to explore our creativity in designing a unique and effective solution.
                  </p>
                </div>
              </div>
            </div>

            {/* Design Features */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">⚙️</span>
                  Design Features
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 border-0" />
              </div>

              <div className="text-center mb-8">
                <Image 
                  src="/assets/engdes/teargear_translucent.png" 
                  alt="Teargear translucent render"
                  width={600}
                  height={400}
                  className="mx-auto rounded-xl shadow-lg border border-gray-700"
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Out-of-the-Box Thinking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/transferBearing.jpeg" 
                      alt="Transfer ball bearing diagram"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Used a roller ball bearing instead of axle and remaining wheels to reduce mass and improve top speed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Optimised Actuation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/gear_calcs.png" 
                      alt="Gear ratio calculations"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      Initial mass estimates used to calculate optimal gear ratios based on efficiency and output speed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Fast Acceleration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Image 
                      src="/assets/engdes/teargear_weightdist.png" 
                      alt="Weight distribution diagram"
                      width={300}
                      height={200}
                      className="w-full rounded-lg"
                    />
                    <p className="text-gray-300 text-sm">
                      72% weight distribution towards drive shaft improves acceleration to reach top speed quicker.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Manufacturing & Testing */}
            <div className="space-y-8">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center gap-4">
                  <span className="text-4xl">🏁</span>
                  Manufacturing & Testing
                </h3>
                <Separator className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 border-0" />
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <Image 
                    src="/assets/engdes/teargear_made.png" 
                    alt="Teargear manufactured version"
                    width={500}
                    height={400}
                    className="w-full rounded-lg shadow-lg border border-gray-700"
                  />
                </div>
                <div className="space-y-4">
                  <Image 
                    src="/assets/engdes/teargear_test.png" 
                    alt="Teargear during testing"
                    width={300}
                    height={200}
                    className="w-full rounded-lg shadow-lg border border-gray-700"
                  />
                  <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50">
                    <CardContent className="p-6 text-center">
                      <h4 className="text-2xl font-bold text-white mb-2">Top Speed Achieved</h4>
                      <p className="text-green-400 text-3xl font-bold">2.21 m/s</p>
                      <p className="text-gray-300 text-sm mt-2">Exceptional performance compared to other vehicles</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}