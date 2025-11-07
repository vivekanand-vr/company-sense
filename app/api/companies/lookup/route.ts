import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { LookupRequest, LookupResponse } from "@/types/company";

// Configure the route for longer execution times
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max duration

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation - just check for required fields
    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }
    
    const requestData: LookupRequest = {
      companyName: body.companyName,
      filters: body.filters || {}
    };
    
    // Call backend API using axios
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(
      `${backendUrl}/api/companies/lookup`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 0, // No timeout - wait indefinitely
      }
    );

    // Return the response without validation
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in lookup API:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message || 'Backend API error';
      
      return NextResponse.json(
        { 
          error: 'Backend API error', 
          details: errorMessage,
          statusCode 
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}