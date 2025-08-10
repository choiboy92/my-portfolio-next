// app/projects/presweather/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, Github } from 'lucide-react'

const description = "Exploring machine learning techniques to classify ambient weather conditions using sensor instrument data"
const role = "Independent Research Project"
const tags = ["Machine Learning", "Neural Networks", "PyTorch", "Data Science", "Weather Analysis"]

export default function PresWeatherPage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      icon: '🌦️',
      content: (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <p className="text-gray-300 leading-relaxed text-lg">
                The Korean Meteorological Agency (KMA) has access to <span className="text-blue-400 font-semibold">94 manned weather stations</span>, 
                where conditions are classified in order to get real-time information across the country.
              </p>
              <p className="text-gray-300 leading-relaxed text-lg">
                However, data such as visibility, rainfall and wind among others are abundant in <span className="text-green-400 font-semibold">464 other unmanned automatic weather stations (AWS)</span> across 
                South Korea, yet they are unable to carry out accurate classification.
              </p>
              <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/50">
                <CardContent className="p-6 text-center">
                  <h4 className="text-xl font-bold text-white mb-2">Current Limitation</h4>
                  <p className="text-red-400 text-2xl font-bold">~70% Accuracy</p>
                  <p className="text-gray-300 text-sm mt-2">Traditional atmospheric relationship methods</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center">
              <Image 
                src="/assets/aws_presence.gif" 
                alt="AWS distribution across South Korea"
                width={400}
                height={300}
                className="rounded-lg shadow-lg border border-gray-700"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'potential',
      title: 'Realising the Full Potential of AWS',
      icon: '🎯',
      content: (
        <div className="space-y-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-gray-300 leading-relaxed text-lg">
              Being able to classify conditions accurately with AWS will enable a much more precise idea of what is happening 
              across the country and fully realise the potential of AWS as an unmanned network.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              Neural networks developed using <Badge variant="outline" className="border-orange-400 text-orange-400">PyTorch</Badge> were 
              researched as an effective and simple solution to this.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Training Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span className="text-gray-300">9,000 data recordings from manned stations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-gray-300">5 different sensor readings per recording</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    <span className="text-gray-300">Applied smoothing functions and normalization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="text-center">
              <Image 
                src="/assets/dataset.png" 
                alt="Dataset example visualization"
                width={300}
                height={400}
                className="mx-auto rounded-lg shadow-lg border border-gray-700"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'training',
      title: 'Training the Model (and Myself)',
      icon: '🤖',
      content: (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Learning Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Having taken an extracurricular seminar series on machine learning techniques during the course of the 
                    Michaelmas term in 2019, I had learnt various tools and considerations regarding model training and refinement.
                  </p>
                  <p className="text-gray-300 text-sm">
                    Over the course of a month, I worked on refining the model; experimenting with various model parameters. 
                    I learnt a significant amount about refining neural networks and balancing bias and variance.
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <a 
                  href="https://github.com/choiboy92/weather-classification"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Github className="w-4 h-4" />
                  View Code
                </a>
                <a 
                  href="https://example.com/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live Demo
                </a>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 p-6">
              <div className="space-y-6">
                <Image 
                  src="/assets/ml_results.png" 
                  alt="Neural network model accuracy results"
                  width={400}
                  height={300}
                  className="w-full rounded-lg"
                />
                
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-lg">Final Model Structure:</h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex justify-between">
                      <span>Input Layer:</span>
                      <Badge variant="outline" className="border-blue-400 text-blue-400">5 inputs</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hidden Layer 1:</span>
                      <Badge variant="outline" className="border-green-400 text-green-400">10 nodes (ReLU)</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hidden Layer 2:</span>
                      <Badge variant="outline" className="border-purple-400 text-purple-400">10 nodes (ReLU)</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Output Layer:</span>
                      <Badge variant="outline" className="border-orange-400 text-orange-400">6 nodes (Softmax)</Badge>
                    </div>
                  </div>
                  
                  <div className="text-center pt-4 border-t border-gray-600">
                    <h5 className="text-green-400 font-bold text-xl">Result: 90% Accuracy</h5>
                    <p className="text-gray-300 text-sm">20% improvement from traditional methods</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              { condition: 'Clear Sky', accuracy: '98%', color: 'from-yellow-400 to-orange-400' },
              { condition: 'Cloudy', accuracy: '92%', color: 'from-gray-400 to-gray-500' },
              { condition: 'Rainy', accuracy: '95%', color: 'from-blue-400 to-blue-600' },
              { condition: 'Foggy', accuracy: '85%', color: 'from-gray-300 to-gray-400' },
              { condition: 'Stormy', accuracy: '88%', color: 'from-purple-400 to-purple-600' },
              { condition: 'Snowy', accuracy: '90%', color: 'from-blue-200 to-blue-300' }
            ].map((condition, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-700 text-center">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r ${condition.color}`}></div>
                  <h5 className="text-white font-semibold text-sm mb-1">{condition.condition}</h5>
                  <p className="text-green-400 font-bold">{condition.accuracy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'impact',
      title: 'The Impact',
      icon: '🌍',
      content: (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📊 <span>Technical Achievement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Accuracy Improvement:</span>
                    <Badge className="bg-green-500 text-black">+20%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Processing Speed:</span>
                    <Badge className="bg-blue-500 text-white">Real-time</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Model Efficiency:</span>
                    <Badge className="bg-purple-500 text-white">Optimized</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🎯 <span>Practical Applications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-300 text-sm">Enable 464 unmanned stations for weather classification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-300 text-sm">Provide more precise country-wide weather monitoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-300 text-sm">Reduce manual classification workload</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <h4 className="text-2xl font-bold text-white mb-4">Key Learnings</h4>
              <p className="text-gray-300 leading-relaxed">
                This project was instrumental in deepening my understanding of neural network optimization, data preprocessing, 
                and the practical challenges of applying machine learning to real-world problems. The significant accuracy 
                improvement demonstrates the potential for AI to enhance traditional meteorological systems.
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <h5 className="text-white font-semibold mb-2">90% Accuracy Achieved</h5>
                <p className="text-gray-400 text-sm">Significant improvement over traditional methods</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <h5 className="text-white font-semibold mb-2">Real-time Processing</h5>
                <p className="text-gray-400 text-sm">Optimized for immediate weather classification</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🌐</div>
                <h5 className="text-white font-semibold mb-2">Scalable Solution</h5>
                <p className="text-gray-400 text-sm">Ready for deployment across 464+ unmanned stations</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSections(prev => {
        if (prev.length < sections.length) {
          return [...prev, sections[prev.length].id]
        }
        clearInterval(timer)
        return prev
      })
    }, 300)

    return () => clearInterval(timer)
  }, [sections.length])

  return (
    <div className="min-h-screen bg-black">
      <ProjectIntro
        name="Present Weather Neural Network"
        date="2020"
        id="presweather"
        description={description}
        tags={tags}
      />
      
      <SideQuickNav/>
      
      {/* Role & Description Cards */}
      <div className="px-4 lg:px-[20%] py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{description}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/50">
            <CardHeader>
              <CardTitle className="text-white">Project Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-cyan-400 font-semibold">{role}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="px-4 lg:px-[10%] space-y-16 pb-16">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`transition-all duration-1000 ${
              visibleSections.includes(section.id)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 flex items-center gap-4">
                <span className="text-4xl">{section.icon}</span>
                {section.title}
              </h2>
              <Separator className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 border-0" />
            </div>
            
            <div className="max-w-6xl mx-auto">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}